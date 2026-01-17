Rails.application.config.after_initialize do
  if defined?(Rails::Server) || defined?(Puma)
    PositionBroadcaster.start
  end
end
