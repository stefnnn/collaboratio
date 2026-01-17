class DemoController < ApplicationController
  def start
    @interact_url = "#{Settings['base_url']}/interact"
    @qr_code = RQRCode::QRCode.new(@interact_url)
  end

  def show; end

  def interact; end
end
