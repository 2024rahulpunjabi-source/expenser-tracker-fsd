

export const TransactionHistory = () => {
    return (
        <div className="col-xl-8 col-lg-8">
            <div className="card">
                <div className="card-header">
                    <h4 className="card-title">Transaction History</h4>
                </div>
                <div className="card-body">
                    <div className="transaction-table">
                        <div className="table-responsive">
                            <table className="table mb-0 table-responsive-sm">
                                <thead>
                                    <tr>
                                        <th>Category</th>
                                        <th>Title</th>
                                        <th>Type</th>
                                        <th>Amount</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>
                                            <span className="table-category-icon"><i
                                                className="bg-emerald-500 fi fi-rr-barber-shop"></i>
                                                Beauty</span>
                                        </td>
                                        <td>
                                            Grocery Items and Beverage soft drinks
                                        </td>
                                        <td>
                                            Income
                                        </td>
                                        <td>500</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
