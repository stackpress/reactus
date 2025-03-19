export default function Edit({ name }: { name: string }) {
  return (
    <p className="py-4">
      Edit <code>with-plugin/pages/{name}.tsx</code> and save to test HMR
    </p>
  )
}