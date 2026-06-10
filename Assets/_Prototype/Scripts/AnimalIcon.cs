using UnityEngine;

namespace AWZ.Proto
{
    /// <summary>
    /// A tappable animal icon placed on a zoo plot. On tap it plays a small
    /// scale "punch", logs the species, and publishes the tap to the UI overlay
    /// (<see cref="AWZ.UI.WorldTapBus"/>) so the game can open the animal detail panel.
    /// Prototype-only (vision build).
    ///
    /// Needs a <see cref="Collider2D"/> for <see cref="OnMouseDown"/> to fire. We can't use
    /// <c>[RequireComponent(typeof(Collider2D))]</c> because Collider2D is abstract (Unity
    /// can't auto-add an abstract type), so instances placed without a collider stay untappable.
    /// Instead we add a sprite-sized BoxCollider2D at runtime if one is missing — this is why
    /// only some animals (the ones that happened to have a collider) were tappable before.
    /// </summary>
    [RequireComponent(typeof(SpriteRenderer))]
    public class AnimalIcon : MonoBehaviour
    {
        public string speciesName = "Animal";

        private Vector3 _baseScale;
        private float _t = -1f;
        private const float Dur = 0.25f;

        private void Awake()
        {
            _baseScale = transform.localScale;
            EnsureTapCollider();
        }

        /// <summary>
        /// Guarantees a 2D collider exists so the icon is tappable. Runtime creation with an
        /// explicit log (allowed by the no-auto-component-lookup rule's dynamic-creation
        /// exception) — not a fallback that hides setup, but the mechanism that makes every
        /// placed animal tappable regardless of how the scene was authored.
        /// </summary>
        private void EnsureTapCollider()
        {
            if (TryGetComponent<Collider2D>(out _)) return;

            var box = gameObject.AddComponent<BoxCollider2D>();
            if (TryGetComponent<SpriteRenderer>(out var sr) && sr.sprite != null)
                box.size = sr.sprite.bounds.size; // local units; transform scale applies on top
            Debug.Log($"[AnimalIcon] Added tap BoxCollider2D to '{name}' (none was present).", this);
        }

        private void OnMouseDown()
        {
            _t = 0f;
            Debug.Log($"[AWZ] Tapped {speciesName}");
            AWZ.UI.WorldTapBus.PublishAnimalTap(speciesName);
        }

        private void Update()
        {
            if (_t < 0f) return;
            _t += Time.deltaTime;
            float k = 1f + 0.18f * Mathf.Sin(Mathf.Clamp01(_t / Dur) * Mathf.PI);
            transform.localScale = _baseScale * k;
            if (_t >= Dur) { transform.localScale = _baseScale; _t = -1f; }
        }
    }
}
