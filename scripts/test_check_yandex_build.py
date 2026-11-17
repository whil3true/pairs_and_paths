"""Release contract tests, including the native ES-module layout used by Cozy Gallery."""
import hashlib
import importlib.util
import json
from pathlib import Path
import struct
import tempfile
import unittest
from unittest.mock import patch
import warnings
import zipfile

spec = importlib.util.spec_from_file_location('validator', Path(__file__).with_name('check-yandex-build.py'))
validator = importlib.util.module_from_spec(spec)
spec.loader.exec_module(validator)


class YandexPackageTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name) / 'dist'
        self.root.mkdir()
        source = Path(self.temp.name) / 'src'
        (source / 'game').mkdir(parents=True)
        for name in ('main.ts', 'game/Catalog.ts', 'game/Chunk.ts'):
            (source / name).write_text('')
        self.put('index.html', b'<script src="./vendor/phaser.js"></script><script type="module" src="./js/main.js"></script><link href="./styles.css">')
        self.put('js/main.js', b'const sdk="/sdk.js"; window.YaGames; import {\nvalue\n} from "./game/Catalog.js"; import("./game/Chunk.js");')
        self.put('js/game/Catalog.js', b'export { value } from "./Chunk.js";')
        self.put('js/game/Chunk.js', b'export const value=1;')
        self.put('vendor/phaser.js', b'/* Phaser MIT notice */')
        self.put('vendor/phaser.LICENSE.txt', b'Phaser MIT license')
        self.put('styles.css', b'@font-face{src:url(./assets/fonts/font.woff2?v=1#font)}')
        assets = {'assets/fonts/font.woff2': b'font', 'assets/fonts/licenses/OFL.txt': b'license'}
        for level in range(1, 101):
            for size in ('full', 'thumbs'):
                assets[f'assets/artwork/pipeline/{size}/level-{level:03}.webp'] = b'approved webp fixture'
        for index in range(30):
            assets[f'assets/symbols/v3/symbol-{index}.png'] = b'approved symbol'
        for index in range(10):
            assets[f'assets/chapter-banners/banner-{index}.webp'] = b'approved banner'
        for name, data in assets.items():
            self.put(name, data)
        self.snapshot = Path(self.temp.name) / 'snapshot.json'
        self.snapshot.write_text(json.dumps({name: hashlib.sha256(data).hexdigest() for name, data in assets.items()}))
        for attribute, value in (('SOURCE_ROOT', source), ('SNAPSHOT_PATH', self.snapshot)):
            context = patch.object(validator, attribute, value)
            context.start()
            self.addCleanup(context.stop)

    def put(self, name, content):
        path = self.root / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(content)

    def archive(self, extras=(), prefix='', compression=zipfile.ZIP_DEFLATED):
        target = Path(self.temp.name) / 'artifact.zip'
        with warnings.catch_warnings(), zipfile.ZipFile(target, 'w', compression) as archive:
            warnings.simplefilter('ignore', UserWarning)
            for path in sorted(self.root.rglob('*')):
                if path.is_file():
                    archive.write(path, prefix + path.relative_to(self.root).as_posix())
            for name, data in extras:
                archive.writestr(name, data)
        return target

    def test_actual_artifact_shape_and_identical_production(self):
        report = validator.validate(self.archive(), self.root)
        self.assertEqual(report['result'], 'PASS')
        self.assertEqual(report['rootEntry'], 'index.html')
        self.assertEqual(report['fullArtworks'], 100)
        self.assertEqual(report['thumbnails'], 100)
        self.assertTrue(report['matchesProduction'])
        self.assertFalse(report['nestedZip'])
        self.assertNotIn('dist', report['topLevel'])
        self.assertGreater(report['zipBytes'], 0)

    def test_directory_and_license_preservation(self):
        self.assertEqual(validator.validate(self.root)['result'], 'PASS')
        self.assertIn('assets/fonts/licenses/OFL.txt', validator.inventory(self.archive()))

    def test_missing_index(self):
        (self.root / 'index.html').unlink()
        with self.assertRaisesRegex(ValueError, 'index.html'):
            validator.validate(self.archive())

    def test_index_inside_dist_wrapper(self):
        with self.assertRaisesRegex(ValueError, 'dist wrapper'):
            validator.validate(self.archive(prefix='dist/'))

    def test_multiple_index_files(self):
        with self.assertRaisesRegex(ValueError, 'index.html'):
            validator.validate(self.archive([('other/index.html', b'bad')]))

    def test_no_nested_zip(self):
        with self.assertRaisesRegex(ValueError, 'nested ZIP'):
            validator.validate(self.archive([('game.zip', b'PK')]))

    def test_missing_phaser(self):
        (self.root / 'vendor/phaser.js').unlink()
        with self.assertRaisesRegex(ValueError, 'vendor/phaser.js'):
            validator.validate(self.archive())

    def test_missing_phaser_license(self):
        (self.root / 'vendor/phaser.LICENSE.txt').unlink()
        with self.assertRaisesRegex(ValueError, 'phaser.LICENSE.txt'):
            validator.validate(self.archive())

    def test_index_must_load_native_entry(self):
        self.put('index.html', b'<script src="./vendor/phaser.js"></script><link href="./styles.css">')
        with self.assertRaisesRegex(ValueError, 'must load js/main.js'):
            validator.validate(self.root)

    def test_audio_module_import_is_module_relative(self):
        source = validator.SOURCE_ROOT / 'audio/Manager.ts'
        source.parent.mkdir()
        source.write_text('')
        self.put('js/audio/Manager.js', b'export const audio = true;')
        self.put('js/main.js', (self.root / 'js/main.js').read_bytes() + b'import "./audio/Manager.js";')
        self.assertEqual(validator.validate(self.archive())['result'], 'PASS')

    def test_new_url_resolution(self):
        for expression in ('new URL("../../assets/fonts/font.woff2", import.meta.url)',
                           'new URL("./assets/fonts/font.woff2", document.baseURI)'):
            with self.subTest(expression=expression):
                self.put('js/game/Catalog.js', ('const url = ' + expression).encode())
                self.assertEqual(validator.validate(self.archive())['result'], 'PASS')

    def test_all_required_asset_categories(self):
        for name in ('assets/artwork/pipeline/full/level-100.webp',
                     'assets/artwork/pipeline/thumbs/level-001.webp',
                     'assets/symbols/v3/symbol-0.png', 'assets/chapter-banners/banner-0.webp'):
            with self.subTest(name=name):
                data = (self.root / name).read_bytes()
                (self.root / name).unlink()
                with self.assertRaisesRegex(ValueError, 'Missing local resource'):
                    validator.validate(self.archive())
                self.put(name, data)

    def test_changed_asset_hash(self):
        self.put('assets/artwork/pipeline/full/level-100.webp', b'damaged')
        with self.assertRaisesRegex(ValueError, 'asset hash mismatch'):
            validator.validate(self.archive())

    def test_snapshot_cannot_omit_last_artwork(self):
        data = json.loads(self.snapshot.read_text())
        del data['assets/artwork/pipeline/full/level-100.webp']
        self.snapshot.write_text(json.dumps(data))
        with self.assertRaisesRegex(ValueError, 'all 100 artworks'):
            validator.validate(self.archive())

    def test_broken_archive(self):
        target = Path(self.temp.name) / 'broken.zip'
        target.write_bytes(b'PK broken')
        with self.assertRaisesRegex(ValueError, 'ZIP'):
            validator.validate(target)

    def test_crc_corruption(self):
        target = self.archive(compression=zipfile.ZIP_STORED)
        with zipfile.ZipFile(target) as archive:
            info = archive.getinfo('index.html')
        data = bytearray(target.read_bytes())
        filename_length, extra_length = struct.unpack_from('<HH', data, info.header_offset + 26)
        offset = info.header_offset + 30 + filename_length + extra_length
        # Stored bytes make this deterministic: changed payload must fail CRC.
        data[offset] ^= 255
        target.write_bytes(data)
        with self.assertRaises((zipfile.BadZipFile, validator.zlib.error)):
            validator.validate(target)

    def test_unpacked_size_and_exact_boundary(self):
        size = sum(path.stat().st_size for path in self.root.rglob('*') if path.is_file())
        with patch.object(validator, 'MAX_BYTES', size):
            self.assertEqual(validator.validate(self.archive())['result'], 'PASS')
        with patch.object(validator, 'MAX_BYTES', size - 1), self.assertRaisesRegex(ValueError, '100 MB'):
            validator.validate(self.archive())

    def test_development_files(self):
        for name in ('src/main.ts', 'tests/test.js', 'node_modules/module.js', '.git/config',
                     '.github/workflows/ci.yml', '.test-dist/test.js', '.simulation-dist/sim.js',
                     'package.json', 'tsconfig.json', 'assets/source.js.map', 'README.md',
                     'docs/design.txt', 'build.tmp', 'game.tar.gz', 'unexpected.js'):
            with self.subTest(name=name), self.assertRaises(ValueError):
                validator.validate(self.archive([(name, b'bad')]))

    def test_unsafe_names(self):
        for name in ('../outside.js', '/absolute.js', 'assets/../escape.js', 'C:\\game.js',
                     'assets//file.png', './index.html', 'file name.png', 'assets/цветок.png'):
            with self.subTest(name=name), self.assertRaises(ValueError):
                validator.validate(self.archive([(name, b'bad')]))

    def test_duplicate_entries_and_case_collisions(self):
        for name, error in (('index.html', 'duplicate'), ('INDEX.html', 'Case-colliding')):
            with self.subTest(name=name), self.assertRaisesRegex(ValueError, error):
                validator.validate(self.archive([(name, b'bad')]))

    def test_native_imports_and_css(self):
        for name in ('js/game/Catalog.js', 'js/game/Chunk.js', 'assets/fonts/font.woff2'):
            with self.subTest(name=name):
                data = (self.root / name).read_bytes()
                (self.root / name).unlink()
                with self.assertRaisesRegex(ValueError, 'Missing local resource'):
                    validator.validate(self.archive())
                self.put(name, data)

    def test_dynamic_asset_literal(self):
        self.put('js/game/Catalog.js', b'const path="assets/missing.png";')
        with self.assertRaisesRegex(ValueError, 'assets/missing.png'):
            validator.validate(self.root)

    def test_official_sdk_contract(self):
        with self.assertRaisesRegex(ValueError, 'local sdk.js'):
            validator.validate(self.archive([('sdk.js', b'stub')]))
        self.put('js/main.js', b'window.YaGames;')
        with self.assertRaisesRegex(ValueError, 'SDK bootstrap'):
            validator.validate(self.root)

    def test_sdk_virtual_endpoint_is_allowed(self):
        self.put('index.html', (self.root / 'index.html').read_bytes() + b'<script src="/sdk.js"></script>')
        self.assertEqual(validator.validate(self.archive())['result'], 'PASS')

    def test_nonportable_resource_urls(self):
        for ref in ('/assets/font.woff2', 'https://example.com/font.woff2', '../outside.woff2'):
            self.put('styles.css', f'@font-face{{src:url({ref})}}'.encode())
            with self.subTest(ref=ref), self.assertRaises(ValueError):
                validator.validate(self.root)

    def test_empty_index(self):
        self.put('index.html', b'')
        with self.assertRaisesRegex(ValueError, 'JavaScript entry'):
            validator.validate(self.root)

    def test_zip_symlink(self):
        info = zipfile.ZipInfo('assets/link')
        info.create_system = 3
        info.external_attr = 0o120777 << 16
        with self.assertRaisesRegex(ValueError, 'symlink'):
            validator.validate(self.archive([(info, b'../outside')]))

    def test_directory_symlink(self):
        (self.root / 'assets/link').symlink_to(self.root / 'index.html')
        with self.assertRaisesRegex(ValueError, 'Symlink'):
            validator.validate(self.root)

    def test_archive_differs_from_tested_dist_bytes(self):
        archive = self.archive()
        self.put('vendor/phaser.js', b'another phaser')
        with self.assertRaisesRegex(ValueError, 'ZIP bytes differ'):
            validator.validate(archive, self.root)

    def test_archive_differs_from_tested_dist_paths(self):
        archive = self.archive()
        self.put('vendor/extra.js', b'extra')
        with self.assertRaisesRegex(ValueError, 'ZIP inventory differs'):
            validator.validate(archive, self.root)


if __name__ == '__main__':
    unittest.main()
