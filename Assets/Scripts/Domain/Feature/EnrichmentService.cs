using System;

namespace AWZ.Domain
{
    /// <summary>
    /// Fe3 — enrichment service. Enforces cap of enrLv≤5 and gold cost formula.
    /// Cost = round(baseAppeal * 20 * (lv+1)) + 200
    /// </summary>
    public class EnrichmentService : IEnrichmentService
    {
        private const int MaxEnrichmentLevel = 5;
        private const int EnrichCostBase     = 200;
        private const int EnrichCostMult     = 20;

        private readonly GameState           _state;
        private readonly ICurrencyService    _currency;
        private readonly Func<string, float> _getBaseAppeal;

        /// <summary>Constructs an EnrichmentService operating on the provided game state.</summary>
        public EnrichmentService(GameState state, ICurrencyService currency, Func<string, float> getBaseAppeal)
        {
            _state         = state         ?? throw new ArgumentNullException(nameof(state));
            _currency      = currency      ?? throw new ArgumentNullException(nameof(currency));
            _getBaseAppeal = getBaseAppeal ?? throw new ArgumentNullException(nameof(getBaseAppeal));
        }

        /// <inheritdoc/>
        public int EnrichmentLevel(string speciesKey)
        {
            return _state.EnrichmentLevels.TryGetValue(speciesKey, out int lv) ? lv : 0;
        }

        /// <inheritdoc/>
        public bool AddEnrichment(string speciesKey)
        {
            int currentLv = EnrichmentLevel(speciesKey);
            if (currentLv >= MaxEnrichmentLevel) return false;

            float baseAppeal = _getBaseAppeal(speciesKey);
            long  cost       = (long)Math.Round(baseAppeal * EnrichCostMult * (currentLv + 1)) + EnrichCostBase;

            if (!_currency.TryPay(CurrencyType.Gold, cost)) return false;

            _state.EnrichmentLevels[speciesKey] = currentLv + 1;
            return true;
        }
    }
}
