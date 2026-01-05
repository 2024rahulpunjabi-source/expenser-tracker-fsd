import React, { useState } from 'react'
import useFetch from '../../hooks/useFetch';
import CustomButton from '../../components/CustomButton';
import TransactionModel from './components/TransactionModel';

function Transactions() {
    const [isTransactionModalOpen , setIsTransactionModalOpen] = useState(false);
    const {data: categories} = useFetch("/categories");
    // console.log(categories);
    
  return (
        <div className="content-body">
            <div className="row">
                <div className="col-12">
                    <div className="page-title">
                        <h3>Transactions</h3>
                    </div>
                    <div>
                        <CustomButton type={'button'} label={"Add Transaction"} onClick={() => { setIsTransactionModalOpen(true)}}/>
                    </div>
                </div>
                <TransactionModel isOpen={isTransactionModalOpen} onCLose={() => setIsTransactionModalOpen(false)} categories={categories}/>
            </div>

        </div>
    )
}

export default Transactions