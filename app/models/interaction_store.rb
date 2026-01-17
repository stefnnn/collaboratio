class InteractionStore
  include Singleton

  def initialize
    @mutex = Mutex.new
    @positions = {}
  end

  def update_position(connection_id, x, y)
    @mutex.synchronize do
      @positions[connection_id] = { x: x, y: y }
    end
  end

  def remove_position(connection_id)
    @mutex.synchronize do
      @positions.delete(connection_id)
    end
  end

  def all_positions
    @mutex.synchronize do
      @positions.values.map { |p| [p[:x], p[:y]] }
    end
  end

  def connection_count
    @mutex.synchronize { @positions.size }
  end

  def reset!
    @mutex.synchronize { @positions.clear }
  end
end
