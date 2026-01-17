class SessionChannel < ApplicationCable::Channel
  def subscribed
    stream_from "session_count"
  end

  def unsubscribed; end
end
