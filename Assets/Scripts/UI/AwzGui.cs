using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UIElements;

namespace AWZ.UI
{
    /// <summary>
    /// Loads the imported GUIPackCartoon icon sprites (copied to
    /// <c>Resources/Art/UI/gui/</c>) and builds ready-to-use <see cref="Image"/> elements.
    /// Textures are cached so the per-tab rebuild doesn't re-hit disk.
    ///
    /// These are full-colour cartoon icons — unlike the procedural mono <see cref="AwzIcons"/>
    /// glyphs — used for the HUD, the bottom nav, care actions and the shop.
    /// </summary>
    public static class AwzGui
    {
        private static readonly Dictionary<string, Texture2D> _cache = new Dictionary<string, Texture2D>();

        /// <summary>Cached load of <c>Resources/Art/UI/gui/&lt;name&gt;</c> (no extension).</summary>
        public static Texture2D Tex(string name)
        {
            if (_cache.TryGetValue(name, out var t) && t != null) return t;
            t = Resources.Load<Texture2D>($"Art/UI/gui/{name}");
            if (t == null) Debug.LogWarning($"[AwzGui] Missing icon: Resources/Art/UI/gui/{name}");
            _cache[name] = t;
            return t;
        }

        /// <summary>A square, pointer-transparent icon Image of the given point size.</summary>
        public static Image Icon(string name, float size)
        {
            var img = new Image
            {
                scaleMode   = ScaleMode.ScaleToFit,
                pickingMode = PickingMode.Ignore,
            };
            img.style.width      = size;
            img.style.height     = size;
            img.style.flexShrink = 0;
            var t = Tex(name);
            if (t != null) img.image = t;
            return img;
        }

        /// <summary>
        /// Sets a 9-sliced sprite as an element's background, tinted. Used to skin cards/panels
        /// with pack art. Falls back to a flat <paramref name="tint"/> fill if the sprite is missing.
        /// </summary>
        public static void Panel9(VisualElement el, string name, int slice, float sliceScale, Color tint)
        {
            var t = Tex(name);
            if (t == null) { el.style.backgroundColor = tint; return; }
            el.style.backgroundImage                = new StyleBackground(t);
            el.style.unitySliceLeft                 = slice;
            el.style.unitySliceRight                = slice;
            el.style.unitySliceTop                  = slice;
            el.style.unitySliceBottom               = slice;
            el.style.unitySliceScale                = sliceScale;
            el.style.unityBackgroundImageTintColor  = tint;
            el.style.backgroundColor                = Color.clear;
        }

        /// <summary>Skins an element as the pack's ribbon banner (horizontal 9-slice, fixed-ish
        /// height). Used for section headers. Tint multiplies the pink ribbon.</summary>
        public static void Banner(VisualElement el, Color tint)
        {
            var t = Tex("header_banner");
            if (t == null) { el.style.backgroundColor = tint; return; }
            el.style.backgroundImage                = new StyleBackground(t);
            el.style.unitySliceLeft                 = 100;
            el.style.unitySliceRight                = 100;
            el.style.unitySliceTop                  = 0;
            el.style.unitySliceBottom               = 0;
            el.style.unitySliceScale                = 0.5f;
            el.style.unityBackgroundImageTintColor  = tint;
            el.style.backgroundColor                = Color.clear;
        }
    }
}
