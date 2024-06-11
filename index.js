import Stripe from "stripe"

export default async ({ req, res, log, error }) => {
  const stripe = new Stripe(process.env.STRIPE_API_KEY)

  try {
    const paymentId = req.body
    const paymentLink = await stripe.paymentLinks.retrieve(paymentId)
    const sessions = await stripe.checkout.sessions.list({
      payment_link: paymentLink.id,
    })

    log(paymentId)
    log(sessions)

    let successfulCharge = null
    let paidOn = null

    for (const session of sessions.data) {
      if (session.payment_status === "paid") {
        const charges = await stripe.charges.list({
          payment_intent: session.payment_intent,
        })

        log(charges)

        successfulCharge = charges.data.find(
          (charge) => charge.status === "succeeded"
        )
        if (successfulCharge) {
          paidOn = new Date(successfulCharge.created * 1000).toISOString()
          break
        }
      }
    }

    const response = {
      ...paymentLink,
      paid: !!successfulCharge,
      paidOn,
      charge: successfulCharge,
    }

    return res.json(response)
  } catch (err) {
    error("Error fetching data: ", err.message)
    return res.empty()
  }
}
