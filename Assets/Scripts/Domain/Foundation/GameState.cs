using System;
using System.Collections.Generic;

namespace AWZ.Domain
{
    /// <summary>
    /// Single authoritative game state. Mutated only via GameController.Apply — never modified directly.
    /// </summary>
    public class GameState
    {
        public long Gold           { get; set; } = 0L;
        public long Gems           { get; set; } = 0L;
        public long Tokens         { get; set; } = 0L;
        public long Reputation     { get; set; } = 0L;
        public int  Xp             { get; set; } = 0;
        public int  Level          { get; set; } = 1;

        public string[] OwnedSpecies         { get; set; } = Array.Empty<string>();
        public Dictionary<string, int> AnimalCounts     { get; set; } = new Dictionary<string, int>();
        public Dictionary<string, int> EnclosureLevels  { get; set; } = new Dictionary<string, int>();
        public Dictionary<string, int> EnrichmentLevels { get; set; } = new Dictionary<string, int>();
        public string[] BuiltAttractions     { get; set; } = Array.Empty<string>();

        public Dictionary<string, AnimalMeters> AnimalMeters { get; set; } = new Dictionary<string, AnimalMeters>();

        public int QuestChapterIndex { get; set; } = 0;
        public int QuestStepIndex    { get; set; } = 0;
        public HashSet<string> ClaimedQuestIds { get; set; } = new HashSet<string>();

        public long     OfflinePendingGold { get; set; } = 0L;
        public DateTime ClosedAtUtc        { get; set; } = DateTime.UtcNow;
    }
}
