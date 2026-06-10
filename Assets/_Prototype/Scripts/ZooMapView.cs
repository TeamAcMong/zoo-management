using System.Collections.Generic;
using UnityEngine;
using AWZ.UI;

namespace AWZ.Proto
{
    /// <summary>
    /// Renders the world-space zoo map from DOMAIN state: one tappable animal per species the
    /// player owns, placed on the painted enclosures. Driven by <see cref="ZooRosterBus"/>
    /// (published by <c>GameApp</c>), so adopting a species makes it appear on the map.
    ///
    /// Self-bootstrapping (no scene wiring) and code-only: animals are spawned at runtime with a
    /// sprite-sheet idle loop (same 4×4 sheets the UI uses) and an <see cref="AnimalIcon"/> for
    /// tap → care. Any hand-placed prototype animals in the scene are disabled so the map shows
    /// only what the player owns.
    ///
    /// Prototype-only (vision build), not the shipping architecture.
    ///
    /// TUNE THESE if the layout looks off after first run:
    ///   • <see cref="MapHalf"/> must match CameraPan2D.mapHalf (world half-size of the map).
    ///   • <see cref="TargetWorldHeight"/> — how tall each animal is in world units.
    ///   • <see cref="SortingOrder"/> — must be above the map background sprite's order.
    ///   • <see cref="PenPct"/> — enclosure centres as % of the map image (top-left origin).
    /// </summary>
    public class ZooMapView : MonoBehaviour
    {
        private static readonly Vector2 MapHalf = new Vector2(3.84f, 6.72f);
        private const float TargetWorldHeight = 1.6f;
        private const int   SortingOrder      = 100;
        private const float AnimFps           = 11f;
        private const int   SheetCols = 4, SheetRows = 4;

        // Enclosure centres as percent of the map image (768×1344, top-left origin).
        // Mirrors GameApp.PenPct so animals land on the painted pens.
        private static readonly (float L, float T)[] PenPct =
        {
            (40f,14f), (17f,24f), (31f,28f), (22f,37f),
            (72f,22f), (78f,38f), (18f,55f), (62f,50f),
            (28f,82f), (45f,45f), (72f,62f), (50f,70f),
        };

        private readonly List<GameObject> _spawned = new List<GameObject>();
        private bool   _protoDisabled;
        private string _sig;

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
        private static void AutoBoot()
        {
            if (FindAnyObjectByType<ZooMapView>() != null) return;
            var go = new GameObject("ZooMapView (auto)");
            go.AddComponent<ZooMapView>();
        }

        private void OnEnable()  => ZooRosterBus.RosterChanged += Rebuild;
        private void OnDisable() => ZooRosterBus.RosterChanged -= Rebuild;

        private void Start() => Rebuild();

        /// <summary>Re-syncs the spawned animals to the published roster. No-ops if unchanged.</summary>
        private void Rebuild()
        {
            if (!_protoDisabled) { DisablePrototypeAnimals(); _protoDisabled = true; }

            string[] owned = ZooRosterBus.OwnedSpecies;
            string sig = string.Join(",", owned);
            if (sig == _sig) return; // roster unchanged → keep existing GameObjects
            _sig = sig;

            foreach (var go in _spawned) if (go != null) Destroy(go);
            _spawned.Clear();

            int n = Mathf.Min(owned.Length, PenPct.Length);
            for (int i = 0; i < n; i++) SpawnAnimal(owned[i], i);

            if (owned.Length > PenPct.Length)
                Debug.LogWarning($"[ZooMapView] {owned.Length} owned species but only " +
                                 $"{PenPct.Length} pens — extra species are not shown on the map.");
        }

        /// <summary>Hides any animals that were hand-placed in the scene (the prototype roster).</summary>
        private void DisablePrototypeAnimals()
        {
            var existing = FindObjectsByType<AnimalIcon>(FindObjectsInactive.Include, FindObjectsSortMode.None);
            foreach (var icon in existing)
            {
                if (_spawned.Contains(icon.gameObject)) continue; // never disable our own
                icon.gameObject.SetActive(false);
            }
        }

        private void SpawnAnimal(string key, int penIndex)
        {
            var go = new GameObject($"ZooAnimal_{key}");
            go.transform.SetParent(transform, false);
            go.transform.position = PenWorldPos(penIndex);

            var sr = go.AddComponent<SpriteRenderer>();
            sr.sortingOrder = SortingOrder;

            Sprite[] frames = LoadIdleFrames(key);
            if (frames != null && frames.Length > 0)
            {
                sr.sprite = frames[0];
                go.AddComponent<IdleSpriteAnimator>().Init(sr, frames, AnimFps);
            }
            else
            {
                sr.sprite = LoadStaticSprite(key); // may be null (logged) — layout still holds
            }

            // AnimalIcon.Awake adds a sprite-sized tap collider, so set the sprite first.
            var icon = go.AddComponent<AnimalIcon>();
            icon.speciesName = key;

            _spawned.Add(go);
        }

        private static Vector3 PenWorldPos(int penIndex)
        {
            var (l, t) = PenPct[penIndex];
            float x = (l / 100f - 0.5f) * (2f * MapHalf.x);
            float y = (0.5f - t / 100f) * (2f * MapHalf.y); // image top → +y
            return new Vector3(x, y, 0f);
        }

        /// <summary>Slices a 4×4 idle sheet (Resources/Art/AnimalsAnim/{key}) into 16 frames.</summary>
        private static Sprite[] LoadIdleFrames(string key)
        {
            var sheet = Resources.Load<Texture2D>($"Art/AnimalsAnim/{key}");
            if (sheet == null) return null;

            int fw = sheet.width  / SheetCols;
            int fh = sheet.height / SheetRows;
            float ppu = fh / TargetWorldHeight;

            var frames = new Sprite[SheetCols * SheetRows];
            int idx = 0;
            for (int row = 0; row < SheetRows; row++)
            {
                for (int col = 0; col < SheetCols; col++)
                {
                    // Sprite rects use a bottom-left origin; row 0 is the TOP of the sheet.
                    var rect = new Rect(col * fw, sheet.height - (row + 1) * fh, fw, fh);
                    frames[idx++] = Sprite.Create(sheet, rect, new Vector2(0.5f, 0.5f), ppu);
                }
            }
            return frames;
        }

        private static Sprite LoadStaticSprite(string key)
        {
            var tex = Resources.Load<Texture2D>($"Art/Animals/{key}");
            if (tex == null)
            {
                Debug.LogWarning($"[ZooMapView] No sprite for species '{key}' " +
                                 $"(Resources/Art/Animals/{key} or .../AnimalsAnim/{key}).");
                return null;
            }
            float ppu = tex.height / TargetWorldHeight;
            return Sprite.Create(tex, new Rect(0, 0, tex.width, tex.height), new Vector2(0.5f, 0.5f), ppu);
        }
    }

    /// <summary>Cycles a SpriteRenderer through a sprite-sheet's frames for a looping idle.</summary>
    public class IdleSpriteAnimator : MonoBehaviour
    {
        private SpriteRenderer _sr;
        private Sprite[]       _frames;
        private float          _interval;
        private float          _timer;
        private int            _frame;

        public void Init(SpriteRenderer sr, Sprite[] frames, float fps)
        {
            _sr       = sr;
            _frames   = frames;
            _interval = 1f / Mathf.Max(1f, fps);
        }

        private void Update()
        {
            if (_sr == null || _frames == null || _frames.Length == 0) return;
            _timer += Time.deltaTime;
            if (_timer < _interval) return;
            _timer -= _interval;
            _frame = (_frame + 1) % _frames.Length;
            _sr.sprite = _frames[_frame];
        }
    }
}
