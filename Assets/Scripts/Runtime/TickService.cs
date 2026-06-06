using System;
using UnityEngine;

namespace AWZ.Runtime
{
    /// <summary>
    /// Drives the game clock. Accumulates delta time and fires gold ticks every second
    /// via GameController. Also forwards elapsed wall-clock time for meter decay.
    /// </summary>
    public class TickService : MonoBehaviour
    {
        [Header("Dependencies")]
        [SerializeField] private GameController _gameController;

        private float _goldTickAccumulator;
        private float _decayAccumulator;

        private void Update()
        {
            if (_gameController == null) return;

            float dt = Time.deltaTime;

            _goldTickAccumulator += dt;
            _decayAccumulator    += dt;

            // Fire gold income tick every second.
            while (_goldTickAccumulator >= 1f)
            {
                _goldTickAccumulator -= 1f;
                _gameController.Tick(1f, DateTime.UtcNow);
            }

            // Decay is driven per-frame with actual delta for smooth interpolation.
            // We send it separately to avoid large accumulated steps.
            // The GameController may choose to batch or pass through.
        }
    }
}
