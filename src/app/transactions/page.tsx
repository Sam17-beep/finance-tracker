import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

export default function TransactionDashboard() {
  return (
    <div className='flex flex-col sm:gap-4 sm:py-4 sm:pl-14'>
      <header className='top-0 flex items-center gap-4 static h-auto border-0 bg-transparent px-6'>
        <h1 className='text-2xl font-semibold leading-none tracking-tight'>Expenses</h1>
        <div className='relative ml-auto flex-1 grow-0'>
          <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
          <Input
            type='search'
            placeholder='Search...'
            className='w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[336px]'
          />
        </div>
      </header>
      <main className='flex-1 items-start p-4 px-6 py-0 gap-8 '>
        <Card x-chunk='dashboard-05-chunk-3'>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='table-cell'>Date</TableHead>
                  <TableHead className='table-cell'>Description</TableHead>
                  <TableHead className='table-cell'>Category</TableHead>
                  <TableHead className='table-cell'>Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className='bg-accent'>
                  <TableCell className='table-cell'>2023-06-23</TableCell>
                  <TableCell className='table-cell'>Description</TableCell>
                  <TableCell className='table-cell'>
                    <Badge className='text-xs' variant='outline'>
                      Test
                    </Badge>
                  </TableCell>
                  <TableCell className='table-cell'>$250.00</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
