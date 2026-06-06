using UnityEngine;

namespace AWZ.Data
{
    /// <summary>
    /// All tuning knobs for the AWZ game. Referenced by services via AppBootstrap.
    /// Values here must match the balance documented in the GDDs.
    /// Create via AWZ/Tuning Config in the Create Asset menu.
    /// </summary>
    [CreateAssetMenu(fileName = "TuningConfig", menuName = "AWZ/Tuning Config")]
    public class TuningConfig : ScriptableObject
    {
        [Header("Economy (C2)")]
        [Tooltip("Gold earned per visitor per second. Formula: goldPerSec = max(1, round(visitors * SpendPerVisitor * (1 + AttractionRevenueMult * |built|)))")]
        public float SpendPerVisitor = 0.05f;

        [Tooltip("Revenue multiplier per built attraction. Applied as (1 + AttractionRevenueMult * |built|).")]
        public float AttractionRevenueMult = 0.12f;

        [Header("Economy / Attractions (C2 / Fe4)")]
        [Tooltip("Capacity multiplier per built attraction. Applied as (1 + AttractionCapacityMult * |built|).")]
        public float AttractionCapacityMult = 0.15f;

        [Header("Collection (Fe1)")]
        [Tooltip("Cost multiplier for buying additional animals. Cost = round(baseAppeal * BuyCostMult * currentCount) + 50. Balance-check 2026-06-06: raised 11 to 50.")]
        public int BuyCostMult = 50;

        [Header("Habitat (Fe2)")]
        [Tooltip("Cost multiplier for enclosure upgrades. Cost = round(baseAppeal * UpgradeCostMult * currentLv) + 300.")]
        public int UpgradeCostMult = 80;

        [Header("Enrichment (Fe3)")]
        [Tooltip("Cost multiplier for enrichment additions. Cost = round(baseAppeal * EnrichCostMult * (lv+1)) + 200.")]
        public int EnrichCostMult = 20;

        [Header("Caps")]
        [Tooltip("Maximum enclosure level per species. Upgrade blocked at this value.")]
        public int MaxEnclosureLevel = 5;

        [Tooltip("Maximum enrichment level per species. Enrichment blocked at this value.")]
        public int MaxEnrichmentLevel = 5;

        [Header("Offline Income (Fe7)")]
        [Tooltip("Fraction of live income rate applied during offline periods.")]
        public float OfflineRateFactor = 0.60f;

        [Tooltip("Maximum offline accumulation window in seconds (8 hours = 28800s).")]
        public int OfflineCapFreeSec = 28800;

        [Header("XP (C1 / Fe1)")]
        [Tooltip("XP granted per care action (feed, water, clean, pet).")]
        public int XpPerCareAction = 3;

        [Tooltip("XP granted when a new animal is adopted.")]
        public int XpPerAdopt = 40;
    }
}
