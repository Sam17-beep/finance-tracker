import ImportSection from '@/components/custom/ImportSection'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function ImportPage() {
  return (
    <div className='flex flex-col sm:gap-4 sm:py-4 sm:pl-14'>
      <header className='top-0 flex items-center justify-center gap-4 static h-auto border-0 bg-transparent px-6'>
        <h1 className='text-5xl font-semibold leading-none tracking-tight'>Import</h1>
      </header>
      <main className='flex-1 items-start p-4 px-6 py-0 gap-8 '>
        <Card className='w-full mx-auto'>
          <CardHeader>
            <CardTitle>Import CSV File</CardTitle>
            <CardDescription>Drag and drop a CSV file or click to upload.</CardDescription>
          </CardHeader>
          <CardContent className='grid gap-6'>
            <ImportSection />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
