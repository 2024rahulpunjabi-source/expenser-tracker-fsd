import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { useForm } from "react-hook-form";
import z from "zod";
import { api } from "../../../config/axios";
import toast from "react-hot-toast";
import { errorHandler } from "../../../utils/utils";
import Modal from "../../../components/Modal";
import { CustomInput } from "../../../components/Custominput";
import CustomButton from "../../../components/CustomButton";
import CustomSelect from "../../../components/CustomSelect";

function TransactionModel({ isOpen, onClose, categories }) {
  const TransactionForm = z.object({
    note: z.string().nonempty("Note is required!").min(3, "Minimum 3 letter"),
    amount: z.string().nonempty("Amount is required"),
    type: z.string().nonempty("Type is required"),
    date: z.string().nonempty("Date is reuqied"),
    category: z.string().nonempty("Category is Reqquired")
  });

  const {
    register,
    reset,
    formState: { errors },
    handleSubmit,
  } = useForm({
    resolver: zodResolver(TransactionForm),
  });

  const categoryOptions = categories && categories?.map((category) => {
      return {
        label: category.name,
        value: category.id,
      };
    });

  const typeOptions = [
    {
      label: "Expense",
      value: "expense",
    },
    {
      label: "Income",
      value: "income",
    },
  ];

  const onSubmit = async (data) => {
    const postObj = {
      notes: data.note,
      amount: data.amount,
      type: data.type,
      date: data.date,
      category_id: data.category,
    };
    try {
      const response = await api({
        method: "POST",
        url: "/transactions",
        data: postObj,
      });
      if (response.status === 201) {
        toast.success("transaction Successfully Created");
        reset();
        onClose();
      }
    } catch (err) {
      errorHandler(err);
    }
  };
//   console.log(categories)
//   console.log(categoryOptions)
  
  return (
    
    
    <Modal
      title={"Add Transaction"}
      isOpen={isOpen}
      onClose={() => {
        reset();
        onClose();
      }}
      className={"w-25"}
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="row">
          <CustomInput
            type={"text"}
            label={"Note"}
            name={"note"}
            register={register}
            error={errors.note}
          />
          <CustomInput
            type={"number"}
            label={"Amount"}
            name={"amount"}
            register={register}
            error={errors.amount}
          />
          <CustomSelect
            label={"Type"}
            error={errors.type}
            register={register}
            name={"type"}
            placeholder={"Select Type"}
            options={typeOptions}
          />
          <CustomInput
            type={"date"}
            label={"Date"}
            name={"date"}
            register={register}
            error={errors.date}
          />
          <CustomSelect
            label={"Category"}
            error={errors.category}
            register={register}
            name={"category"}
            placeholder={"Select Category"}
            options={categoryOptions}
          />
          <CustomButton label={"Add Transaction"} />
        </div>
      </form>
    </Modal>
  );
}

export default TransactionModel;
