import Stripe from "stripe"

export default async ({ req, res, log, error }) => {
  const stripe = new Stripe(process.env.STRIPE_API_KEY)

  try {
    const paymentId = req.body
    const paymentLink = await stripe.paymentLinks.retrieve(paymentId)
    log(paymentLink)

    const lineItems = await stripe.paymentLinks.listLineItems(paymentId)
    log(lineItems)

    const charges = await stripe.charges.list({
      payment_link: paymentLink.id,
    })
    log(charges)

    let successfulCharge = null
    let paidOn = null

    successfulCharge = charges.data.find(
      (charge) => charge.status === "succeeded"
    )

    if (successfulCharge) {
      paidOn = new Date(successfulCharge.created * 1000).toISOString()
    }

    const itemPrices = lineItems.data.map((item) => ({
      price: item.price.unit_amount,
      currency: item.price.currency,
      quantity: item.quantity,
    }))

    const response = {
      ...paymentLink,
      paid: !!successfulCharge,
      paidOn,
      charge: successfulCharge,
      itemPrices,
    }

    return res.json(response)
  } catch (err) {
    error("Error fetching data: ", err.message)
    return res.empty()
  }
}
