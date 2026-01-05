import { useCallback, useEffect, useState } from "react"
import { api } from "../config/axios"

function useFetch(url) {
  const [data , setData] = useState(null)
  const [error , setError] = useState(null)
  const [loading , setLoading] = useState(null)

  const fetchData = useCallback(async() =>{
    setLoading(true)
    try{
        const response = await api({
            method: "GET",
            url: url
        })
        if (response.status === 200) {
            setData(response.data.data)
        }
    } catch(err){
        setError(err.response.data.data)
    } finally {setLoading(false)}
  } , [url])

  useEffect(()=>{
    (async ()=>{
        await fetchData()
    })()

  },[fetchData])

  return{
    data, error, loading 
  }
} 

export default useFetch
