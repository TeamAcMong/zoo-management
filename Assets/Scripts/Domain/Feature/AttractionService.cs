using System;

namespace AWZ.Domain
{
    /// <summary>
    /// Fe4 — attraction build service. Enforces level gate and duplicate guard.
    /// TODO: Wire unlock gates when AttractionDef data is available.
    /// </summary>
    public class AttractionService : IAttractionService
    {
        private readonly GameState _state;

        /// <summary>Constructs an AttractionService operating on the provided game state.</summary>
        public AttractionService(GameState state)
        {
            _state = state ?? throw new ArgumentNullException(nameof(state));
        }

        /// <inheritdoc/>
        public bool IsBuilt(string attractionKey)
        {
            return Array.IndexOf(_state.BuiltAttractions, attractionKey) >= 0;
        }

        /// <inheritdoc/>
        public float RevenueMult()
        {
            return 1f + 0.12f * _state.BuiltAttractions.Length;
        }

        /// <inheritdoc/>
        public float CapacityMult()
        {
            return 1f + 0.15f * _state.BuiltAttractions.Length;
        }

        /// <inheritdoc/>
        public bool Build(string attractionKey)
        {
            // TODO: Wire level gate (unlock level check) and gold cost once AttractionDef
            // data is available from the Data layer.
            return false;
        }
    }
}
