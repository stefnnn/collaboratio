import { Controller } from "@hotwired/stimulus"
import { createConsumer } from "@rails/actioncable"

export default class extends Controller {
  static targets = ["count"]

  connect() {
    this.cable = createConsumer()
    this.subscription = this.cable.subscriptions.create(
      { channel: "SessionChannel" },
      {
        received: (data) => {
          if (data.type === "count_update") {
            this.countTarget.textContent = data.count
          }
        }
      }
    )
  }

  disconnect() {
    this.subscription?.unsubscribe()
    this.cable?.disconnect()
  }
}
