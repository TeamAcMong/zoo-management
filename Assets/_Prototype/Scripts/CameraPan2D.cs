using UnityEngine;

namespace AWZ.Proto
{
    /// <summary>
    /// Drag-to-pan an orthographic 2D camera, clamped to the zoo map bounds.
    /// Prototype-only (vision build), not the shipping architecture.
    /// </summary>
    [RequireComponent(typeof(Camera))]
    public class CameraPan2D : MonoBehaviour
    {
        [Tooltip("Half size of the map in world units (width/2, height/2).")]
        public Vector2 mapHalf = new Vector2(3.84f, 6.72f);

        [Tooltip("Zoom-in factor. 1 = whole map fits (no panning). >1 zooms in so the map is " +
                 "larger than the screen and can be dragged around. 1.6 ≈ shows ~60% per axis.")]
        [Min(1f)] public float zoom = 1.6f;

        private Camera _cam;
        private Vector3 _lastMouse;
        private bool _dragging;
        private int _lastScreenW;
        private int _lastScreenH;
        private float _lastAspect;

        private void Awake()
        {
            _cam = GetComponent<Camera>();
            ApplyFit();
            Clamp();
        }

        /// <summary>
        /// Contain-fit (the orthographic size that shows the WHOLE map on the current aspect),
        /// then divided by <see cref="zoom"/> to zoom in. At zoom &gt; 1 the view is smaller than
        /// the map on both axes, so <see cref="Clamp"/> leaves room to drag the camera around —
        /// which is what makes the map pannable (at zoom = 1 there is no slack and it stays put).
        /// </summary>
        private void ApplyFit()
        {
            if (_cam == null || !_cam.orthographic) return;
            float byHeight = mapHalf.y;
            float byWidth  = mapHalf.x / Mathf.Max(0.0001f, _cam.aspect);
            float containSize = Mathf.Max(byHeight, byWidth);
            _cam.orthographicSize = containSize / Mathf.Max(1f, zoom);
        }

        private void Update()
        {
            if (_cam == null) return;

            // Re-fit when the screen size OR the camera aspect changes. Aspect changes when the
            // UI frames the map into a sub-rect via Camera.rect (GameApp.UpdateMapViewport), so
            // we must re-fit then too — not only on rotation/resize.
            if (Screen.width != _lastScreenW || Screen.height != _lastScreenH
                || !Mathf.Approximately(_cam.aspect, _lastAspect))
            {
                _lastScreenW = Screen.width;
                _lastScreenH = Screen.height;
                _lastAspect  = _cam.aspect;
                ApplyFit();
                Clamp();
            }

            if (Input.GetMouseButtonDown(0)) { _lastMouse = Input.mousePosition; _dragging = true; }
            else if (Input.GetMouseButtonUp(0)) { _dragging = false; }

            if (_dragging && Input.GetMouseButton(0))
            {
                Vector3 delta = Input.mousePosition - _lastMouse;
                _lastMouse = Input.mousePosition;
                float worldPerPixel = (_cam.orthographicSize * 2f) / Screen.height;
                transform.position -= new Vector3(delta.x, delta.y, 0f) * worldPerPixel;
                Clamp();
            }
        }

        private void Clamp()
        {
            float vh = _cam.orthographicSize;
            float vw = vh * _cam.aspect;
            float maxX = Mathf.Max(0f, mapHalf.x - vw);
            float maxY = Mathf.Max(0f, mapHalf.y - vh);
            Vector3 p = transform.position;
            p.x = Mathf.Clamp(p.x, -maxX, maxX);
            p.y = Mathf.Clamp(p.y, -maxY, maxY);
            transform.position = p;
        }
    }
}
