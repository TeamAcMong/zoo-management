using System;
using UnityEngine;
using UnityEngine.UIElements;

namespace AWZ.UI
{
    /// <summary>
    /// Procedurally-drawn, single-colour ("solid mono") feature icons using UI Toolkit's
    /// <see cref="Painter2D"/>. No PNG assets are used — every glyph is a flat vector
    /// silhouette filled with one colour, so it stays crisp at any DPI and is recoloured
    /// for active/inactive states by simply passing a different <c>color</c>.
    ///
    /// Design intent (per UX direction 2026-06-10): icons are deliberately simple and
    /// mono-tone — no gradients, no multi-colour decoration.
    /// </summary>
    public static class AwzIcons
    {
        public enum Kind
        {
            // Currency / status
            Coin, Gem, Star,
            // Care actions
            Feed, Water, Clean, Pet,
            // Navigation tabs
            Zoo, Animals, Attract, Activities, Shop,
            // Controls
            Close,
        }

        /// <summary>
        /// Builds a square icon element of the given point size, drawn entirely in
        /// <paramref name="color"/>. The element ignores pointer events so it never
        /// steals taps from its parent button.
        /// </summary>
        public static VisualElement Make(Kind kind, float size, Color color)
        {
            var el = new VisualElement();
            el.style.width      = size;
            el.style.height     = size;
            el.style.flexShrink = 0;
            el.pickingMode      = PickingMode.Ignore;
            el.generateVisualContent += mgc => Draw(mgc, kind, color);
            // First layout pass has no size yet; repaint once geometry is known.
            el.RegisterCallback<GeometryChangedEvent>(_ => el.MarkDirtyRepaint());
            return el;
        }

        // ── Painter2D dispatch ───────────────────────────────────────────────
        private static void Draw(MeshGenerationContext mgc, Kind kind, Color color)
        {
            Rect rect = mgc.visualElement.contentRect;
            float s = Mathf.Min(rect.width, rect.height);
            if (s <= 1f) return;

            // Centre the drawing box inside the (possibly non-square) content rect.
            float ox = (rect.width  - s) * 0.5f;
            float oy = (rect.height - s) * 0.5f;

            var p = mgc.painter2D;
            p.fillColor   = color;
            p.strokeColor = color;
            p.lineJoin    = LineJoin.Round;
            p.lineCap     = LineCap.Round;

            // Normalised (0..1) → pixel coordinate inside the centred box.
            Func<float, float, Vector2> P = (nx, ny) => new Vector2(ox + nx * s, oy + ny * s);

            switch (kind)
            {
                case Kind.Coin:       DrawCoin(p, P, s);       break;
                case Kind.Gem:        DrawGem(p, P);           break;
                case Kind.Star:       DrawStar(p, P);          break;
                case Kind.Feed:       DrawFeed(p, P, s);       break;
                case Kind.Water:      DrawWater(p, P, s);      break;
                case Kind.Clean:      DrawClean(p, P);         break;
                case Kind.Pet:        DrawPaw(p, P, s);        break;
                case Kind.Zoo:        DrawHouse(p, P);         break;
                case Kind.Animals:    DrawAnimalHead(p, P, s); break;
                case Kind.Attract:    DrawBalloon(p, P, s);    break;
                case Kind.Activities: DrawBolt(p, P);          break;
                case Kind.Shop:       DrawBag(p, P, s);        break;
                case Kind.Close:      DrawClose(p, P, s);      break;
            }
        }

        // ── Primitives ───────────────────────────────────────────────────────

        private static void Disc(Painter2D p, Vector2 center, float radius)
        {
            p.BeginPath();
            p.Arc(center, radius, Angle.Degrees(0f), Angle.Degrees(360f));
            p.Fill();
        }

        /// <summary>Filled N-point star/sparkle. All coordinates normalised (0..1).</summary>
        private static void PolyStar(Painter2D p, Func<float, float, Vector2> P,
                                     float cx, float cy, float outer, float inner,
                                     int points, float rotDeg)
        {
            p.BeginPath();
            int n = points * 2;
            for (int i = 0; i < n; i++)
            {
                float radius = (i % 2 == 0) ? outer : inner;
                float ang = Mathf.Deg2Rad * (rotDeg + i * (180f / points));
                float x = cx + Mathf.Cos(ang) * radius;
                float y = cy + Mathf.Sin(ang) * radius;
                Vector2 pt = P(x, y);
                if (i == 0) p.MoveTo(pt);
                else        p.LineTo(pt);
            }
            p.ClosePath();
            p.Fill();
        }

        // ── Icon glyphs ──────────────────────────────────────────────────────

        private static void DrawCoin(Painter2D p, Func<float, float, Vector2> P, float s)
            => Disc(p, P(0.5f, 0.5f), s * 0.42f);

        private static void DrawGem(Painter2D p, Func<float, float, Vector2> P)
        {
            p.BeginPath();
            p.MoveTo(P(0.50f, 0.08f));
            p.LineTo(P(0.90f, 0.42f));
            p.LineTo(P(0.50f, 0.92f));
            p.LineTo(P(0.10f, 0.42f));
            p.ClosePath();
            p.Fill();
        }

        private static void DrawStar(Painter2D p, Func<float, float, Vector2> P)
            => PolyStar(p, P, 0.5f, 0.52f, 0.44f, 0.18f, 5, -90f);

        private static void DrawClean(Painter2D p, Func<float, float, Vector2> P)
            => PolyStar(p, P, 0.5f, 0.5f, 0.46f, 0.13f, 4, -90f); // 4-point sparkle

        private static void DrawFeed(Painter2D p, Func<float, float, Vector2> P, float s)
        {
            // Food mound (full disc; its lower half merges into the bowl below).
            Disc(p, P(0.5f, 0.46f), s * 0.20f);

            // Bowl: flat rim + rounded base.
            p.BeginPath();
            p.MoveTo(P(0.16f, 0.56f));
            p.LineTo(P(0.84f, 0.56f));
            p.LineTo(P(0.68f, 0.84f));
            p.QuadraticCurveTo(P(0.50f, 0.92f), P(0.32f, 0.84f));
            p.ClosePath();
            p.Fill();
        }

        private static void DrawWater(Painter2D p, Func<float, float, Vector2> P, float s)
        {
            // Bulb + spike → teardrop. Drawn as two overlapping fills (same colour).
            Disc(p, P(0.5f, 0.66f), s * 0.26f);
            p.BeginPath();
            p.MoveTo(P(0.50f, 0.08f));
            p.LineTo(P(0.72f, 0.58f));
            p.LineTo(P(0.28f, 0.58f));
            p.ClosePath();
            p.Fill();
        }

        private static void DrawPaw(Painter2D p, Func<float, float, Vector2> P, float s)
        {
            Disc(p, P(0.50f, 0.66f), s * 0.24f); // main pad
            float tr = s * 0.10f;                // toe beans
            Disc(p, P(0.28f, 0.40f), tr);
            Disc(p, P(0.43f, 0.29f), tr);
            Disc(p, P(0.57f, 0.29f), tr);
            Disc(p, P(0.72f, 0.40f), tr);
        }

        private static void DrawHouse(Painter2D p, Func<float, float, Vector2> P)
        {
            // Roof
            p.BeginPath();
            p.MoveTo(P(0.50f, 0.12f));
            p.LineTo(P(0.92f, 0.50f));
            p.LineTo(P(0.08f, 0.50f));
            p.ClosePath();
            p.Fill();
            // Body
            p.BeginPath();
            p.MoveTo(P(0.20f, 0.50f));
            p.LineTo(P(0.80f, 0.50f));
            p.LineTo(P(0.80f, 0.90f));
            p.LineTo(P(0.20f, 0.90f));
            p.ClosePath();
            p.Fill();
        }

        private static void DrawAnimalHead(Painter2D p, Func<float, float, Vector2> P, float s)
        {
            // Two ears (leaf shapes)
            p.BeginPath();
            p.MoveTo(P(0.35f, 0.10f));
            p.QuadraticCurveTo(P(0.27f, 0.40f), P(0.43f, 0.46f));
            p.QuadraticCurveTo(P(0.45f, 0.24f), P(0.35f, 0.10f));
            p.ClosePath();
            p.Fill();

            p.BeginPath();
            p.MoveTo(P(0.65f, 0.10f));
            p.QuadraticCurveTo(P(0.73f, 0.40f), P(0.57f, 0.46f));
            p.QuadraticCurveTo(P(0.55f, 0.24f), P(0.65f, 0.10f));
            p.ClosePath();
            p.Fill();

            // Head
            Disc(p, P(0.5f, 0.62f), s * 0.28f);
        }

        private static void DrawBalloon(Painter2D p, Func<float, float, Vector2> P, float s)
        {
            Disc(p, P(0.5f, 0.40f), s * 0.30f); // body
            // Knot
            p.BeginPath();
            p.MoveTo(P(0.45f, 0.68f));
            p.LineTo(P(0.55f, 0.68f));
            p.LineTo(P(0.50f, 0.76f));
            p.ClosePath();
            p.Fill();
            // String
            p.lineWidth = Mathf.Max(1.5f, s * 0.045f);
            p.BeginPath();
            p.MoveTo(P(0.50f, 0.76f));
            p.QuadraticCurveTo(P(0.60f, 0.88f), P(0.50f, 0.96f));
            p.Stroke();
        }

        private static void DrawBolt(Painter2D p, Func<float, float, Vector2> P)
        {
            p.BeginPath();
            p.MoveTo(P(0.56f, 0.08f));
            p.LineTo(P(0.28f, 0.54f));
            p.LineTo(P(0.46f, 0.54f));
            p.LineTo(P(0.42f, 0.92f));
            p.LineTo(P(0.72f, 0.42f));
            p.LineTo(P(0.52f, 0.42f));
            p.ClosePath();
            p.Fill();
        }

        private static void DrawClose(Painter2D p, Func<float, float, Vector2> P, float s)
        {
            p.lineWidth = Mathf.Max(2f, s * 0.13f);
            p.BeginPath();
            p.MoveTo(P(0.26f, 0.26f));
            p.LineTo(P(0.74f, 0.74f));
            p.MoveTo(P(0.74f, 0.26f));
            p.LineTo(P(0.26f, 0.74f));
            p.Stroke();
        }

        private static void DrawBag(Painter2D p, Func<float, float, Vector2> P, float s)
        {
            // Handle (arched stroke avoids partial-arc direction ambiguity).
            p.lineWidth = Mathf.Max(2f, s * 0.06f);
            p.BeginPath();
            p.MoveTo(P(0.36f, 0.42f));
            p.QuadraticCurveTo(P(0.50f, 0.18f), P(0.64f, 0.42f));
            p.Stroke();
            // Bag body (slight downward taper).
            p.BeginPath();
            p.MoveTo(P(0.26f, 0.42f));
            p.LineTo(P(0.74f, 0.42f));
            p.LineTo(P(0.80f, 0.90f));
            p.LineTo(P(0.20f, 0.90f));
            p.ClosePath();
            p.Fill();
        }
    }
}
