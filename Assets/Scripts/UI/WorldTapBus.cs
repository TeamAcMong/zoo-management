using System;

namespace AWZ.UI
{
    /// <summary>
    /// One-way bridge from world-space objects to the UI Toolkit overlay.
    ///
    /// World GameObjects (e.g. <c>AnimalIcon</c>) live in the default <c>Assembly-CSharp</c>
    /// assembly, which auto-references <c>AWZ.UI</c> — but <c>AWZ.UI</c> cannot reference the
    /// default assembly back. So the event must live HERE, in AWZ.UI: the world publishes,
    /// <see cref="GameApp"/> subscribes. Keeps the two sides decoupled with no circular ref.
    /// </summary>
    public static class WorldTapBus
    {
        /// <summary>Raised when the player taps an animal in the world. Argument = the tapped
        /// object's species identifier (key or display name — resolved by the listener).</summary>
        public static event Action<string> AnimalTapped;

        public static void PublishAnimalTap(string species) => AnimalTapped?.Invoke(species);
    }
}
