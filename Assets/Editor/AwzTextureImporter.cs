using UnityEditor;
using UnityEngine;

namespace AWZ.EditorTools
{
    /// <summary>
    /// Forces crisp import settings on every texture under <c>Resources/Art/</c> so the emoji
    /// sprites render sharp at small UI sizes. The default Unity import (mipmaps ON + lossy
    /// compression) makes flat art look blurry when displayed smaller than its source size —
    /// this postprocessor disables mipmaps and compression for our art only.
    ///
    /// Runs automatically whenever a texture in that folder is (re)imported. To apply to the
    /// already-imported emoji: right-click <c>Assets/Resources/Art</c> in the Project window
    /// and choose <b>Reimport</b>.
    /// </summary>
    public sealed class AwzTextureImporter : AssetPostprocessor
    {
        private void OnPreprocessTexture()
        {
            string path = assetPath.Replace('\\', '/');
            if (!path.Contains("/Resources/Art/")) return;

            var importer = (TextureImporter)assetImporter;

            importer.textureType         = TextureImporterType.Default; // used as Texture2D by UI Toolkit Image
            importer.mipmapEnabled       = false;   // <- the main blur fix: no pre-blurred mip levels
            importer.filterMode          = FilterMode.Bilinear;
            importer.wrapMode            = TextureWrapMode.Clamp;
            importer.alphaIsTransparency = true;
            importer.npotScale           = TextureImporterNPOTScale.None;
            importer.maxTextureSize      = 512;
            importer.textureCompression  = TextureImporterCompression.Uncompressed; // crisp flat art, no block artifacts

            // Android: force uncompressed RGBA32 so the build doesn't recompress (and blur) them.
            var android = importer.GetPlatformTextureSettings("Android");
            android.overridden         = true;
            android.maxTextureSize     = 512;
            android.format             = TextureImporterFormat.RGBA32;
            android.textureCompression = TextureImporterCompression.Uncompressed;
            importer.SetPlatformTextureSettings(android);
        }
    }
}
