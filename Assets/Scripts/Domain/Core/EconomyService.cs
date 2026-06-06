using System;

namespace AWZ.Domain
{
    /// <summary>
    /// C2 — pure derivation of economy metrics from current state. No mutations performed.
    /// Formula: goldPerSec = max(1, round(visitors * 0.05 * (1 + 0.12 * built)))
    /// </summary>
    public class EconomyService : IEconomyService
    {
        private readonly GameState          _state;
        private readonly IHabitatService    _habitat;
        private readonly IEnrichmentService _enrichment;
        private readonly IAttractionService _attractions;
        private readonly Func<string, float> _getBaseAppeal;

        /// <summary>
        /// Constructs an EconomyService.
        /// </summary>
        /// <param name="state">The current game state.</param>
        /// <param name="habitat">Used to read enclosure levels per species.</param>
        /// <param name="enrichment">Used to read enrichment levels per species.</param>
        /// <param name="attractions">Used to read built attraction counts and multipliers.</param>
        /// <param name="getBaseAppeal">Delegate that returns the base appeal for a species key (from Data layer).</param>
        public EconomyService(
            GameState state,
            IHabitatService habitat,
            IEnrichmentService enrichment,
            IAttractionService attractions,
            Func<string, float> getBaseAppeal)
        {
            _state         = state         ?? throw new ArgumentNullException(nameof(state));
            _habitat       = habitat       ?? throw new ArgumentNullException(nameof(habitat));
            _enrichment    = enrichment    ?? throw new ArgumentNullException(nameof(enrichment));
            _attractions   = attractions   ?? throw new ArgumentNullException(nameof(attractions));
            _getBaseAppeal = getBaseAppeal ?? throw new ArgumentNullException(nameof(getBaseAppeal));
        }

        /// <inheritdoc/>
        public double AppealOf(string speciesKey)
        {
            if (!_state.AnimalCounts.TryGetValue(speciesKey, out int count) || count <= 0)
                return 0.0;

            float baseAppeal = _getBaseAppeal(speciesKey);
            int   encLv      = _habitat.EnclosureLevel(speciesKey);
            int   enrLv      = _enrichment.EnrichmentLevel(speciesKey);

            // AppealOf(k) = base * count * (1 + 0.25*(encLv-1)) * (1 + 0.10*enrLv)
            return baseAppeal * count * (1.0 + 0.25 * (encLv - 1)) * (1.0 + 0.10 * enrLv);
        }

        /// <inheritdoc/>
        public long Capacity()
        {
            double totalSeats = 0.0;
            foreach (string key in _state.OwnedSpecies)
            {
                if (!_state.AnimalCounts.TryGetValue(key, out int count) || count <= 0)
                    continue;

                float baseAppeal = _getBaseAppeal(key);
                int   encLv      = _habitat.EnclosureLevel(key);

                // seatsOf(k) = base * count * (0.6 + 0.5*(encLv-1))
                totalSeats += baseAppeal * count * (0.6 + 0.5 * (encLv - 1));
            }

            float capMult = _attractions.CapacityMult(); // 1 + 0.15 * |built|
            return (long)Math.Round((5.0 + totalSeats) * capMult);
        }

        /// <inheritdoc/>
        public long GoldPerSec()
        {
            long   cap      = Capacity();
            double totalApp = 0.0;
            foreach (string key in _state.OwnedSpecies)
                totalApp += AppealOf(key);

            // demand = round(totalAppeal * 1.0)
            long demand   = (long)Math.Round(totalApp);
            long visitors = Math.Min(demand, cap);

            int built = _state.BuiltAttractions.Length;

            // goldPerSec = max(1, round(visitors * 0.05 * (1 + 0.12 * built)))
            double raw = visitors * 0.05 * (1.0 + 0.12 * built);
            return Math.Max(1L, (long)Math.Round(raw));
        }
    }
}
