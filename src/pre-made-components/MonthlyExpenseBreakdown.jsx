

export const MonthlyExpenseBreakdown = () => {
    return(
        <div className=" col-xxl-4 col-xl-4 col-lg-6 col-md-12">
            <div className="card">
                <div className="card-header">
                    <h4 className="card-title">Monthly Expenses Breakdown</h4>
                </div>
                <div className="card-body">
                    <div className="progress-stacked">
                        <div className="progress" style={{width: "38%"}}>
                            <div className="progress-bar bg-orange-500"></div>
                        </div>
                    </div>
                    <div className="list-1 mt-3">
                        <ul>
                            <li>
                                <p className="mb-0"><i className="fi fi-ss-circle text-orange-500"></i>Food</p>
                                <h5 className="mb-0"><span>$1200</span>38%</h5>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    )
}


