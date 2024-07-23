import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChangeEvent } from 'react'

interface Props {
  columns: string[]
  // eslint-disable-next-line unused-imports/no-unused-vars
  setColumns: (cols: string[]) => void
}

export function ImportCard({ columns, setColumns }: Props) {
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    // @ts-ignore
    const file: File | null = event.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target?.result as string
        parseCsv(text)
      }
      reader.readAsText(file)
    }
  }

  const parseCsv = (text: string) => {
    const lines = text.split('\n')
    const header = lines[0]
    const columnNames = header.split(/[,;\t]/)
    setColumns(columnNames)
  }

  return (
    <>
      <div className='grid gap-10 items-center justify-center border-2 border-dashed border-muted rounded-md p-12'>
        <Label htmlFor='expense-csv'>Drag and drop your CSV file here to upload</Label>
        <Input id='expense-csv' type='file' accept='.csv' onChange={handleFileChange} />
      </div>
      {columns.length > 0 && (
        <>
          <div className='grid gap-4'>
            <div className='grid gap-2'>
              <Label htmlFor='column-mapping'>Map CSV Columns</Label>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>CSV Column</TableHead>
                    <TableHead>Map To</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Description</TableCell>
                    <TableCell>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder='Select field' />
                        </SelectTrigger>
                        <SelectContent>
                          {columns.map((column) => (
                            <SelectItem key={column} value={column}>
                              {column}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Cost</TableCell>
                    <TableCell>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder='Select field' />
                        </SelectTrigger>
                        <SelectContent>
                          {columns.map((column) => (
                            <SelectItem key={column} value={column}>
                              {column}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Revenue</TableCell>
                    <TableCell>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder='Select field' />
                        </SelectTrigger>
                        <SelectContent>
                          {columns.map((column) => (
                            <SelectItem key={column} value={column}>
                              {column}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder='Select field' />
                        </SelectTrigger>
                        <SelectContent>
                          {columns.map((column) => (
                            <SelectItem key={column} value={column}>
                              {column}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
          <CardFooter className='flex justify-end'>
            <Button type='submit'>Process</Button>
          </CardFooter>
        </>
      )}
    </>
  )
}
