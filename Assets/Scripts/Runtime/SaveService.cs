using System;
using System.Collections.Generic;
using UnityEngine;
using AWZ.Domain;

namespace AWZ.Runtime
{
    /// <summary>
    /// F3 — save/load service backed by JSON at Application.persistentDataPath.
    /// Debounces saves by 300 ms. Flushes immediately on application pause/quit.
    /// </summary>
    public class SaveService : MonoBehaviour, ISaveService
    {
        private const string SaveFileName   = "awz_save.json";
        private const float  SaveDebounceMs = 0.3f;
        private const int    CurrentSchema  = 1;

        /// <inheritdoc/>
        public int SchemaVersion => CurrentSchema;

        private string SavePath => System.IO.Path.Combine(Application.persistentDataPath, SaveFileName);

        private bool     _pendingSave;
        private GameState _pendingState;

        // ── ISaveService ────────────────────────────────────────────────────────

        /// <inheritdoc/>
        public GameState Load()
        {
            try
            {
                if (System.IO.File.Exists(SavePath))
                {
                    string json = System.IO.File.ReadAllText(SavePath);
                    var blob = JsonUtility.FromJson<SaveBlob>(json);
                    if (blob != null)
                        return BlobToState(blob);
                }
            }
            catch (Exception ex)
            {
                Debug.LogWarning($"[SaveService] Load failed (returning defaults): {ex.Message}");
            }
            return new GameState();
        }

        /// <inheritdoc/>
        public void Save(GameState state)
        {
            _pendingState = state;
            if (!_pendingSave)
            {
                _pendingSave = true;
                Invoke(nameof(ExecuteSave), SaveDebounceMs);
            }
        }

        /// <inheritdoc/>
        public void Flush(GameState state, DateTime closedAtUtc)
        {
            state.ClosedAtUtc = closedAtUtc;
            WriteImmediate(state);
        }

        /// <inheritdoc/>
        public void Wipe()
        {
            try
            {
                if (System.IO.File.Exists(SavePath))
                    System.IO.File.Delete(SavePath);
            }
            catch (Exception ex)
            {
                Debug.LogWarning($"[SaveService] Wipe failed: {ex.Message}");
            }
        }

        // ── Unity lifecycle ──────────────────────────────────────────────────────

        private void OnApplicationPause(bool paused)
        {
            if (paused && _pendingState != null)
                Flush(_pendingState, DateTime.UtcNow);
        }

        private void OnApplicationFocus(bool hasFocus)
        {
            if (!hasFocus && _pendingState != null)
                Flush(_pendingState, DateTime.UtcNow);
        }

        // ── Private helpers ──────────────────────────────────────────────────────

        private void ExecuteSave()
        {
            _pendingSave = false;
            if (_pendingState != null)
                WriteImmediate(_pendingState);
        }

        private void WriteImmediate(GameState state)
        {
            try
            {
                string json = JsonUtility.ToJson(StateToBlobForWrite(state), prettyPrint: false);
                System.IO.File.WriteAllText(SavePath, json);
            }
            catch (Exception ex)
            {
                Debug.LogError($"[SaveService] Write failed: {ex.Message}");
            }
        }

        private static GameState BlobToState(SaveBlob blob)
        {
            var state = new GameState
            {
                Gold              = blob.gold,
                Gems              = blob.gems,
                Tokens            = blob.tokens,
                Reputation        = blob.reputation,
                Xp                = blob.xp,
                Level             = Mathf.Max(1, blob.level),
                QuestChapterIndex = blob.questChapterIndex,
                QuestStepIndex    = blob.questStepIndex,
                OfflinePendingGold = blob.offlinePendingGold,
            };

            try { state.ClosedAtUtc = DateTime.Parse(blob.closedAtUtc); }
            catch { state.ClosedAtUtc = DateTime.UtcNow; }

            state.OwnedSpecies      = blob.ownedSpecies      ?? Array.Empty<string>();
            state.BuiltAttractions  = blob.builtAttractions  ?? Array.Empty<string>();

            state.AnimalCounts      = DictFromBlob(blob.animalCountKeys,      blob.animalCountValues);
            state.EnclosureLevels   = DictFromBlob(blob.enclosureLevelKeys,   blob.enclosureLevelValues);
            state.EnrichmentLevels  = DictFromBlob(blob.enrichmentLevelKeys,  blob.enrichmentLevelValues);

            state.ClaimedQuestIds = new HashSet<string>(blob.claimedQuestIds ?? Array.Empty<string>());

            // AnimalMeters are not serialized in v1 — they will be rebuilt from defaults.

            return state;
        }

        private static SaveBlob StateToBlobForWrite(GameState state)
        {
            var blob = new SaveBlob
            {
                schemaVersion      = CurrentSchema,
                gold               = state.Gold,
                gems               = state.Gems,
                tokens             = state.Tokens,
                reputation         = state.Reputation,
                xp                 = state.Xp,
                level              = state.Level,
                ownedSpecies       = state.OwnedSpecies,
                builtAttractions   = state.BuiltAttractions,
                questChapterIndex  = state.QuestChapterIndex,
                questStepIndex     = state.QuestStepIndex,
                claimedQuestIds    = new List<string>(state.ClaimedQuestIds).ToArray(),
                offlinePendingGold = state.OfflinePendingGold,
                closedAtUtc        = state.ClosedAtUtc.ToString("O"),
            };

            DictToBlob(state.AnimalCounts,     out blob.animalCountKeys,     out blob.animalCountValues);
            DictToBlob(state.EnclosureLevels,  out blob.enclosureLevelKeys,  out blob.enclosureLevelValues);
            DictToBlob(state.EnrichmentLevels, out blob.enrichmentLevelKeys, out blob.enrichmentLevelValues);

            return blob;
        }

        private static Dictionary<string, int> DictFromBlob(string[] keys, int[] values)
        {
            var dict = new Dictionary<string, int>();
            if (keys == null || values == null) return dict;
            int len = Mathf.Min(keys.Length, values.Length);
            for (int i = 0; i < len; i++)
                dict[keys[i]] = values[i];
            return dict;
        }

        private static void DictToBlob(Dictionary<string, int> dict, out string[] keys, out int[] values)
        {
            keys   = new string[dict.Count];
            values = new int[dict.Count];
            int i  = 0;
            foreach (var kv in dict) { keys[i] = kv.Key; values[i] = kv.Value; i++; }
        }

        // ── Serializable blob ────────────────────────────────────────────────────

        [System.Serializable]
        private class SaveBlob
        {
            public int    schemaVersion;
            public long   gold;
            public long   gems;
            public long   tokens;
            public long   reputation;
            public int    xp;
            public int    level;
            public string[] ownedSpecies;
            public string[] builtAttractions;
            public string[] animalCountKeys;
            public int[]    animalCountValues;
            public string[] enclosureLevelKeys;
            public int[]    enclosureLevelValues;
            public string[] enrichmentLevelKeys;
            public int[]    enrichmentLevelValues;
            public int    questChapterIndex;
            public int    questStepIndex;
            public string[] claimedQuestIds;
            public long   offlinePendingGold;
            public string closedAtUtc;
        }
    }
}
