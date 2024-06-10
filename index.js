import Stripe from "stripe"

export default async ({ req, res, log, error }) => {
  const stripe = new Stripe(process.env.STRIPE_API_KEY)

  try {
    const paymentId = req.body
    const paymentLink = await stripe.paymentLinks.retrieve(paymentId)

    log(paymentLink)

    const charges = await stripe.charges.list({
      payment_intent: paymentLink.payment_intent,
    })

    log(charges)

    const successfulCharge = charges.data.find(
      (charge) => charge.status === "succeeded"
    )

    if (successfulCharge) {
      return res.json({
        status: "paid",
      })
    } else {
      return res.json({
        status: "unpaid",
      })
    }
  } catch (err) {
    error("Error fetching data: ", err.message)
    return res.empty()
  }
}
