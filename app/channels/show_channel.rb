class ShowChannel < ApplicationCable::Channel
  def subscribed
    stream_from "show"
  end

  def unsubscribed; end
end
