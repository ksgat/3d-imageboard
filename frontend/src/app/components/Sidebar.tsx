import Posts from "./Post";

export default function Sidebar() {

  return (
    <div
      className="h-full p-4 box-border overflow-y-auto sidebar bg-black text-white"
    >
      {/* formerly tabs */}
      <div className="flex mb-4 gap-2">
      <Posts />
      </div>

 
    </div>
  );
}