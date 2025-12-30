"use client";

export default function UpgradePage() {
  const plans = [
    {
      name: "Basic",
      price: "Free",
      features: ["Limited AI responses", "Community support", "Basic analytics"],
    },
    {
      name: "Pro",
      price: "₹499/month",
      features: [
        "Unlimited AI questions",
        "Priority support",
        "Advanced analytics dashboard",
      ],
    },
    {
      name: "Enterprise",
      price: "Custom",
      features: [
        "Team collaboration",
        "API access",
        "Dedicated support manager",
      ],
    },
  ];

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Upgrade Your Plan</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className="bg-white rounded-2xl shadow-md border p-6 text-center"
          >
            <h2 className="text-xl font-semibold mb-2">{plan.name}</h2>
            <p className="text-lg mb-4 text-gray-600">{plan.price}</p>
            <ul className="mb-4 space-y-2">
              {plan.features.map((feature) => (
                <li key={feature} className="text-gray-700">
                  ✅ {feature}
                </li>
              ))}
            </ul>
            <button className="w-full bg-indigo-500 hover:bg-indigo-600 text-white py-2 px-4 rounded-lg">
              Choose Plan
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
