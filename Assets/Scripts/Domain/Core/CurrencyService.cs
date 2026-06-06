using System;

namespace AWZ.Domain
{
    /// <summary>
    /// F2 — concrete atomic currency operations backed by GameState.
    /// No negative balance is ever permitted. Animals may never be purchased with Gems.
    /// </summary>
    public class CurrencyService : ICurrencyService
    {
        private readonly GameState _state;

        /// <summary>Constructs a CurrencyService operating on the provided game state.</summary>
        public CurrencyService(GameState state)
        {
            _state = state ?? throw new ArgumentNullException(nameof(state));
        }

        /// <inheritdoc/>
        public long Balance(CurrencyType t)
        {
            return t switch
            {
                CurrencyType.Gold       => _state.Gold,
                CurrencyType.Gems       => _state.Gems,
                CurrencyType.Tokens     => _state.Tokens,
                CurrencyType.Reputation => _state.Reputation,
                _                       => throw new ArgumentOutOfRangeException(nameof(t), t, null)
            };
        }

        /// <inheritdoc/>
        public bool TryPay(CurrencyType t, long amount)
        {
            if (amount < 0)
                throw new ArgumentOutOfRangeException(nameof(amount), "Amount must be non-negative.");

            // Architectural constraint: animals are never payable in Gems.
            // Callers must pass Gold (or Tokens) for animal purchases.
            if (t == CurrencyType.Gems)
                throw new InvalidOperationException(
                    "TryPay with CurrencyType.Gems is not allowed for animal purchases. Use Gold or Tokens.");

            if (Balance(t) < amount)
                return false;

            SetBalance(t, Balance(t) - amount);
            return true;
        }

        /// <inheritdoc/>
        public void Grant(CurrencyType t, long amount)
        {
            if (amount < 0)
                throw new ArgumentOutOfRangeException(nameof(amount), "Amount must be non-negative.");

            SetBalance(t, Balance(t) + amount);
        }

        private void SetBalance(CurrencyType t, long value)
        {
            switch (t)
            {
                case CurrencyType.Gold:       _state.Gold       = value; break;
                case CurrencyType.Gems:       _state.Gems       = value; break;
                case CurrencyType.Tokens:     _state.Tokens     = value; break;
                case CurrencyType.Reputation: _state.Reputation = value; break;
                default: throw new ArgumentOutOfRangeException(nameof(t), t, null);
            }
        }
    }
}
