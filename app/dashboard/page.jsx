import AddNewInterview from "./_components/AddNewInterview"

const Dashboard = () => {
  return (
    <div className="p-10">
        <h2 className="font-bold text-2xl">Dashboard</h2>
        <h2 className="text-gray-500">Create and start your Ai Interview Simulator</h2>
        <div className="grid grid-col-1 md:grid-col-3 my-5"><AddNewInterview/></div>
    </div>
  )
}
export default Dashboard