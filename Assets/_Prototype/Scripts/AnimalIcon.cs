using UnityEngine;

namespace AWZ.Proto
{
    /// <summary>
    /// A tappable animal icon placed on a zoo plot. On tap it plays a small
    /// scale "punch" and logs the species. Prototype-only (vision build).
    /// </summary>
    [RequireComponent(typeof(SpriteRenderer))]
    public class AnimalIcon : MonoBehaviour
    {
        public string speciesName = "Animal";

        private Vector3 _baseScale;
        private float _t = -1f;
        private const float Dur = 0.25f;

        private void Awake() => _baseScale = transform.localScale;

        private void OnMouseDown()
        {
            _t = 0f;
            Debug.Log($"[AWZ] Tapped {speciesName}");
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
