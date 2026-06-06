using System;

namespace AWZ.Domain
{
    /// <summary>F3 — save/load JSON blob at persistentDataPath.</summary>
    public interface ISaveService
    {
        /// <summary>Current schema version for migration checks.</summary>
        int SchemaVersion { get; }

        /// <summary>Returns defaults on missing/corrupt; never throws to caller.</summary>
        GameState Load();

        /// <summary>Debounced by caller. Idempotent.</summary>
        void Save(GameState state);

        /// <summary>Flush immediately with closedAt timestamp (called on app pause/quit).</summary>
        void Flush(GameState state, DateTime closedAtUtc);

        /// <summary>Wipes the save file and resets to defaults.</summary>
        void Wipe();
    }
}
