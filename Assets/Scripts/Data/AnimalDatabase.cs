using UnityEngine;

namespace AWZ.Data
{
    /// <summary>
    /// Container for all animal definitions. Assigned to AppBootstrap via inspector.
    /// Create via AWZ/Animal Database in the Create Asset menu.
    /// </summary>
    [CreateAssetMenu(fileName = "AnimalDatabase", menuName = "AWZ/Animal Database")]
    public class AnimalDatabase : ScriptableObject
    {
        [Tooltip("All animal definitions in the game. One entry per species.")]
        public AnimalDef[] Animals;

        /// <summary>
        /// Returns the AnimalDef matching the given species key, or null if not found.
        /// </summary>
        public AnimalDef GetDef(string speciesKey)
        {
            if (Animals == null) return null;
            foreach (var def in Animals)
            {
                if (def != null && def.SpeciesKey == speciesKey)
                    return def;
            }
            return null;
        }
    }
}
