using System.Collections.Generic;

namespace AWZ.Runtime
{
    /// <summary>
    /// Hard-coded animal roster used by the code-only dev harness (<see cref="DevHarness"/>)
    /// so the game is playable in the editor WITHOUT authoring AnimalDatabase/TuningConfig
    /// ScriptableObject assets or a wired scene. The shipping build uses AWZ.Data.AnimalDatabase
    /// instead — this is a development convenience, not production content.
    /// </summary>
    public static class DefaultAnimalData
    {
        /// <summary>One species row: stable key, display name, base appeal, level required to adopt.</summary>
        public readonly struct AnimalInfo
        {
            public readonly string Key;
            public readonly string Name;
            public readonly float  Appeal;
            public readonly int    UnlockLevel;

            public AnimalInfo(string key, string name, float appeal, int unlockLevel)
            {
                Key = key; Name = name; Appeal = appeal; UnlockLevel = unlockLevel;
            }
        }

        /// <summary>The dev roster — appeal values follow the GDD appeal ladder; unlock levels stagger progression.</summary>
        public static readonly AnimalInfo[] All =
        {
            new AnimalInfo("rabbit",   "Rabbit",   3f,    1),
            new AnimalInfo("chicken",  "Chicken",  8f,    1),
            new AnimalInfo("goat",     "Goat",     14f,   2),
            new AnimalInfo("sheep",    "Sheep",    30f,   3),
            new AnimalInfo("pig",      "Pig",      50f,   4),
            new AnimalInfo("deer",     "Deer",     70f,   5),
            new AnimalInfo("penguin",  "Penguin",  85f,   7),
            new AnimalInfo("monkey",   "Monkey",   130f,  9),
            new AnimalInfo("zebra",    "Zebra",    150f,  11),
            new AnimalInfo("giraffe",  "Giraffe",  170f,  13),
            new AnimalInfo("lion",     "Lion",     190f,  15),
            new AnimalInfo("elephant", "Elephant", 230f,  18),
        };

        private static readonly Dictionary<string, AnimalInfo> ByKey = BuildIndex();

        private static Dictionary<string, AnimalInfo> BuildIndex()
        {
            var map = new Dictionary<string, AnimalInfo>(All.Length);
            foreach (var a in All) map[a.Key] = a;
            return map;
        }

        /// <summary>Base appeal for a species key, or 0 if unknown.</summary>
        public static float AppealOf(string key)
            => ByKey.TryGetValue(key, out var a) ? a.Appeal : 0f;

        /// <summary>Level required to adopt a species, or 1 if unknown.</summary>
        public static int UnlockLevelOf(string key)
            => ByKey.TryGetValue(key, out var a) ? a.UnlockLevel : 1;

        /// <summary>Display name for a species key, or the key itself if unknown.</summary>
        public static string NameOf(string key)
            => ByKey.TryGetValue(key, out var a) ? a.Name : key;
    }
}
