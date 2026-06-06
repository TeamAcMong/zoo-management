using System;
using System.Collections.Generic;

namespace AWZ.Domain
{
    /// <summary>The type of care action a player can perform on an animal.</summary>
    public enum CareActionType
    {
        Feed,
        Water,
        Clean,
        Pet
    }

    /// <summary>
    /// Provides care operations and meter decay simulation (C1).
    /// Decay rates are derived from the 30-minute cycle specified in the design docs.
    /// </summary>
    public interface ICareService
    {
        /// <summary>Performs a care action on the animal with the given key, updating its meter and granting XP.</summary>
        void DoAction(string key, CareActionType action);

        /// <summary>Applies time-based decay to all animal meters.</summary>
        void Decay(float elapsedSeconds);

        /// <summary>Returns the average happiness across all owned animals (0–100). Returns 0 if no animals owned.</summary>
        float AvgHappiness();

        /// <summary>Returns the meters for a specific animal. Returns null if key not found.</summary>
        AnimalMeters GetMeters(string key);
    }

    /// <summary>
    /// C1 — concrete care service. Manages per-animal meters, applies care actions (+30 per action),
    /// and decays meters over time based on 30-minute cycle rates.
    /// </summary>
    public class CareService : ICareService
    {
        // Decay per real second derived from 30-minute (1800s) decay cycle:
        //   Hunger:  -3 / 1800s  = -0.001667/s
        //   Thirst:  -4 / 1800s  = -0.002222/s
        //   Clean:   -3 / 1800s  = -0.001667/s
        //   Happy:   -2 / 1800s  = -0.001111/s
        private const float HungerDecayPerSec = 3f  / 1800f;
        private const float ThirstDecayPerSec = 4f  / 1800f;
        private const float CleanDecayPerSec  = 3f  / 1800f;
        private const float HappyDecayPerSec  = 2f  / 1800f;

        private const float CareActionBoost = 30f;
        private const float MeterMin        = 0f;
        private const float MeterMax        = 100f;
        private const int   XpPerAction     = 3;

        private readonly GameState     _state;
        private readonly ILevelService _level;
        private readonly EventBus      _bus;

        /// <summary>Constructs a CareService operating on the provided game state.</summary>
        public CareService(GameState state, ILevelService level, EventBus bus)
        {
            _state = state ?? throw new ArgumentNullException(nameof(state));
            _level = level ?? throw new ArgumentNullException(nameof(level));
            _bus   = bus   ?? throw new ArgumentNullException(nameof(bus));
        }

        /// <inheritdoc/>
        public void DoAction(string key, CareActionType action)
        {
            AnimalMeters meters = EnsureMeters(key);

            switch (action)
            {
                case CareActionType.Feed:
                    meters.Hunger = Math.Clamp(meters.Hunger + CareActionBoost, MeterMin, MeterMax);
                    break;
                case CareActionType.Water:
                    meters.Thirst = Math.Clamp(meters.Thirst + CareActionBoost, MeterMin, MeterMax);
                    break;
                case CareActionType.Clean:
                    meters.Clean  = Math.Clamp(meters.Clean  + CareActionBoost, MeterMin, MeterMax);
                    break;
                case CareActionType.Pet:
                    meters.Happy  = Math.Clamp(meters.Happy  + CareActionBoost, MeterMin, MeterMax);
                    break;
                default:
                    throw new ArgumentOutOfRangeException(nameof(action), action, null);
            }

            _level.AddXp(XpPerAction);
        }

        /// <inheritdoc/>
        public void Decay(float elapsedSeconds)
        {
            if (elapsedSeconds <= 0f) return;

            foreach (string key in _state.OwnedSpecies)
            {
                AnimalMeters meters = EnsureMeters(key);
                meters.Hunger = Math.Clamp(meters.Hunger - HungerDecayPerSec * elapsedSeconds, MeterMin, MeterMax);
                meters.Thirst = Math.Clamp(meters.Thirst - ThirstDecayPerSec * elapsedSeconds, MeterMin, MeterMax);
                meters.Clean  = Math.Clamp(meters.Clean  - CleanDecayPerSec  * elapsedSeconds, MeterMin, MeterMax);
                meters.Happy  = Math.Clamp(meters.Happy  - HappyDecayPerSec  * elapsedSeconds, MeterMin, MeterMax);
            }
        }

        /// <inheritdoc/>
        public float AvgHappiness()
        {
            if (_state.OwnedSpecies.Length == 0) return 0f;

            float sum = 0f;
            foreach (string key in _state.OwnedSpecies)
                sum += EnsureMeters(key).Happy;

            return sum / _state.OwnedSpecies.Length;
        }

        /// <inheritdoc/>
        public AnimalMeters GetMeters(string key)
        {
            _state.AnimalMeters.TryGetValue(key, out var meters);
            return meters;
        }

        private AnimalMeters EnsureMeters(string key)
        {
            if (!_state.AnimalMeters.TryGetValue(key, out var meters))
            {
                meters = new AnimalMeters();
                _state.AnimalMeters[key] = meters;
            }
            return meters;
        }
    }
}
