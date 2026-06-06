using UnityEngine;

namespace AWZ.Data
{
    /// <summary>
    /// Defines a single animal species: identity, appeal, unlock gate, and visual.
    /// Create assets via AWZ/Animal Definition in the Create Asset menu.
    /// </summary>
    [CreateAssetMenu(fileName = "AnimalDef", menuName = "AWZ/Animal Definition")]
    public class AnimalDef : ScriptableObject
    {
        [Header("Identity")]
        [Tooltip("Unique runtime key matching GameState dictionary keys (e.g. 'lion', 'penguin').")]
        public string SpeciesKey;

        [Tooltip("Human-readable display name shown in UI.")]
        public string DisplayName;

        [Header("Economy")]
        [Tooltip("Base appeal value used in C2 economy formulas.")]
        public float BaseAppeal;

        [Header("Progression")]
        [Tooltip("Player level required to unlock this species.")]
        public int UnlockLevel;

        [Header("Visuals")]
        [Tooltip("Sprite displayed in animal cards and map view.")]
        public Sprite Sprite;
    }
}
