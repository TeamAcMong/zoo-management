using UnityEngine;

namespace AWZ.UI
{
    /// <summary>
    /// Auto-spawns the <see cref="GameApp"/> (UI Toolkit runtime UI) after the first scene
    /// loads — no scene wiring or inspector setup required. Press Play in any scene to see
    /// the game UI.
    ///
    /// This replaces <c>AWZ.Runtime.DevPlayBootstrap</c> which previously spawned the IMGUI
    /// <c>DevHarness</c>. DevPlayBootstrap's auto-spawn has been neutralised; only this class
    /// auto-boots the game now.
    /// </summary>
    public static class GameAppBootstrap
    {
        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
        private static void AutoBoot()
        {
            // Guard: if a GameApp already exists (additive scene load, domain reload), skip.
            if (Object.FindAnyObjectByType<GameApp>() != null) return;

            var go = new GameObject("AWZ GameApp (auto)");
            Object.DontDestroyOnLoad(go);
            go.AddComponent<GameApp>();

            Debug.Log("[GameAppBootstrap] Spawned GameApp with UI Toolkit runtime UI.");
        }
    }
}
