class InteractChannel < ApplicationCable::Channel
  def subscribed
    stream_from "interact"
    InteractionStore.instance.update_position(connection_id, 0, 0)
    broadcast_count
  end

  def unsubscribed
    InteractionStore.instance.remove_position(connection_id)
    broadcast_count
  end

  def update_position(data)
    x = data["x"].to_f.clamp(-1, 1)
    y = data["y"].to_f.clamp(-1, 1)
    InteractionStore.instance.update_position(connection_id, x, y)
  end

  private

  def broadcast_count
    ActionCable.server.broadcast(
      "session_count",
      { type: "count_update", count: InteractionStore.instance.connection_count }
    )
  end
end
