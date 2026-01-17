class PositionBroadcaster
  BROADCAST_INTERVAL = 0.2

  def self.start
    @thread ||= Thread.new do
      loop do
        broadcast_positions
        sleep BROADCAST_INTERVAL
      end
    end
  end

  def self.stop
    @thread&.kill
    @thread = nil
  end

  def self.broadcast_positions
    positions = InteractionStore.instance.all_positions
    ActionCable.server.broadcast("show", { type: "params", params: positions })
  rescue => e
    Rails.logger.error "PositionBroadcaster error: #{e.message}"
  end
end
