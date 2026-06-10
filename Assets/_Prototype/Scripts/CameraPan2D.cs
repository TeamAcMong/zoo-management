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

        private Camera _cam;
        private Vector3 _lastMouse;
        private bool _dragging;
        private int _lastScreenW;
        private int _lastScreenH;

        private void Awake()
        {
            _cam = GetComponent<Camera>();
            ApplyFit();
            Clamp();
        }

        /// <summary>
        /// Contain-fit: pick the smallest orthographic size that still shows the WHOLE map
        /// on the current screen aspect, so the entire zoo is visible on every device
        /// (portrait phone, tablet, WebGL window) instead of an aspect-dependent crop.
        /// </summary>
        private void ApplyFit()
        {
            if (_cam == null || !_cam.orthographic) return;
            float byHeight = mapHalf.y;
            float byWidth  = mapHalf.x / Mathf.Max(0.0001f, _cam.aspect);
            _cam.orthographicSize = Mathf.Max(byHeight, byWidth);
        }

        private void Update()
        {
            if (_cam == null) return;

            // Re-fit only when the screen size actually changes (rotation / resize / window).
            if (Screen.width != _lastScreenW || Screen.height != _lastScreenH)
            {
                _lastScreenW = Screen.width;
                _lastScreenH = Screen.height;
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
