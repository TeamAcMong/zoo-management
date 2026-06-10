using System;

namespace AWZ.UI
{
    /// <summary>
    /// Publishes the player's currently-owned species so the world-space zoo map
    /// (<c>ZooMapView</c>, default assembly) can render exactly the animals the player owns —
    /// driven by domain state, not hand-placed scene art.
    ///
    /// Lives in AWZ.UI for the same reason as <see cref="WorldTapBus"/>: the default assembly
    /// auto-references AWZ.UI but not vice-versa, so the shared contract must sit here.
    /// </summary>
    public static class ZooRosterBus
    {
        /// <summary>The latest published roster (species keys). Never null after first publish.</summary>
        public static string[] OwnedSpecies { get; private set; } = Array.Empty<string>();

        /// <summary>Raised whenever <see cref="OwnedSpecies"/> is republished.</summary>
        public static event Action RosterChanged;

        public static void Publish(string[] ownedSpecies)
        {
            OwnedSpecies = ownedSpecies ?? Array.Empty<string>();
            RosterChanged?.Invoke();
        }
    }
}
