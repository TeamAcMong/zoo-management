using System;

namespace AWZ.Domain
{
    /// <summary>
    /// Fe2 — enclosure upgrade service. Enforces cap of encLv≤5 and gold cost formula.
    /// Cost = round(baseAppeal * 80 * currentLv) + 300
    /// </summary>
    public class HabitatService : IHabitatService
    {
        private const int   MaxEnclosureLevel = 5;
        private const int   UpgradeCostBase   = 300;
        private const int   UpgradeCostMult   = 80;

        private readonly GameState          _state;
        private readonly ICurrencyService   _currency;
        private readonly Func<string, float> _getBaseAppeal;

        /// <summary>Constructs a HabitatService operating on the provided game state.</summary>
        public HabitatService(GameState state, ICurrencyService currency, Func<string, float> getBaseAppeal)
        {
            _state         = state         ?? throw new ArgumentNullException(nameof(state));
            _currency      = currency      ?? throw new ArgumentNullException(nameof(currency));
            _getBaseAppeal = getBaseAppeal ?? throw new ArgumentNullException(nameof(getBaseAppeal));
        }

        /// <inheritdoc/>
        public int EnclosureLevel(string speciesKey)
        {
            return _state.EnclosureLevels.TryGetValue(speciesKey, out int lv) ? lv : 1;
        }

        /// <inheritdoc/>
        public bool Upgrade(string speciesKey)
        {
            int currentLv = EnclosureLevel(speciesKey);
            if (currentLv >= MaxEnclosureLevel) return false;

            float baseAppeal = _getBaseAppeal(speciesKey);
            long  cost       = (long)Math.Round(baseAppeal * UpgradeCostMult * currentLv) + UpgradeCostBase;

            if (!_currency.TryPay(CurrencyType.Gold, cost)) return false;

            _state.EnclosureLevels[speciesKey] = currentLv + 1;
            return true;
        }
    }
}
