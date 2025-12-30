
const Payments = () => {
  return (
      <div className={"row"}>
          <div className={"col-sm-12 col-md-6 col-xl-6 mx-auto"}>
              <div className={"card mt-5 shadow"}>
                  <h4 className={"card-header mb-2"}>Lifetime Subscription</h4>
                  <div className={"card-body"}>
                      <h5>Take Control of Your Finances Forever with One Simple Payment</h5>
                      <p>Why deal with recurring payments when you can manage your expenses seamlessly for a
                          lifetime?
                          Our lifetime subscription unlocks all features with a one-time payment, giving you the
                          tools
                          to stay on top of your financial goals—forever.</p>
                      <h5>What’s Included?</h5>
                      <ul style={{listStyle: "inside"}}>
                          <li>Unlimited Access to expense tracking, budgeting tools, and reports</li>
                          <li>No Hidden Costs — one payment, lifetime access!</li>
                      </ul>
                      <h4>One-Time Payment: ₹999</h4>
                      <hr/>
                        {/* Payment element comes here */}
                  </div>
              </div>
          </div>
      </div>
  )
}

export default Payments
