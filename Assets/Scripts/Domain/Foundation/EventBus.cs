using System;
using System.Collections.Generic;

namespace AWZ.Domain
{
    /// <summary>
    /// Simple generic pub/sub event bus (pure C#, no UnityEngine dependency).
    /// Supports multiple subscribers per event type.
    /// </summary>
    public class EventBus
    {
        private readonly Dictionary<Type, Delegate> _handlers = new Dictionary<Type, Delegate>();

        /// <summary>Subscribe to events of type <typeparamref name="T"/>.</summary>
        public void Subscribe<T>(Action<T> handler)
        {
            var type = typeof(T);
            if (_handlers.TryGetValue(type, out var existing))
                _handlers[type] = Delegate.Combine(existing, handler);
            else
                _handlers[type] = handler;
        }

        /// <summary>Unsubscribe a previously registered handler for type <typeparamref name="T"/>.</summary>
        public void Unsubscribe<T>(Action<T> handler)
        {
            var type = typeof(T);
            if (_handlers.TryGetValue(type, out var existing))
            {
                var updated = Delegate.Remove(existing, handler);
                if (updated == null)
                    _handlers.Remove(type);
                else
                    _handlers[type] = updated;
            }
        }

        /// <summary>Publish an event of type <typeparamref name="T"/> to all subscribers.</summary>
        public void Publish<T>(T evt)
        {
            var type = typeof(T);
            if (_handlers.TryGetValue(type, out var handler))
                (handler as Action<T>)?.Invoke(evt);
        }
    }
}
