Function Model_SerialCartKhan(Ceil As String)
s = Trim(Ceil)
L = Len(s)
s3 = Mid(s, 1, 4)
s2 = Mid(s, 1, 3)
s = Mid(s, 1, 2)

Application.Calculation = xlCalculationManual
Application.ScreenUpdating = False

n = ""
'------------------------------------------------
If L = 7 Then
    If s = "2K" Then n = "S80"
    If s = "26" Then n = "S80"
    If s = "54" Then n = "S800"
    If s = "30" Then n = "S90"
    If s = "37" Then n = "S90"
    If s = "38" Then n = "S90"
    If s = "3D" Then n = "S90"
    If s = "55" Then n = "S900"
    
End If


If L = 8 Then
    If s = "51" Then n = "D210"
    If s = "5C" Then n = "D210"
    If s = "5F" Then n = "D210"

    

    
'----PAX
    If s = "25" Then n = "S80"
    If s = "29" Then n = "S80"
    If s = "2K" Then n = "S80"
    If s = "2L" Then n = "S80"
    If s = "2M" Then n = "S80"
    If s = "2N" Then n = "S80"
    If s = "3L" Then n = "S90"
    If s = "6P" Then n = "S80"
    If s = "7D" Then n = "S80"
    If s = "89" Then n = "S80"
    If s = "8E" Then n = "S80"
    If s = "M0" Then n = "S80"
    
    
    If s = "54" Then n = "S800"
    
    If s = "88" Then n = "S90"
    If s = "8C" Then n = "S90"
    If s = "D0" Then n = "S90"
    If s = "H0" Then n = "S90"
    If s = "H1" Then n = "S90"
    If s = "P3" Then n = "S90"
    If s = "03" Then n = "S90"
    If s = "2D" Then n = "S90"
    If s = "2M" Then n = "S80"
    If s = "30" Then n = "S90"
    If s = "32" Then n = "S90"
    If s = "36" Then n = "S90"
    If s = "38" Then n = "S90"
    If s = "3A" Then n = "S90"
    If s = "3C" Then n = "S90"
    If s = "3D" Then n = "S90"
    If s = "3E" Then n = "S90"
    If s = "3F" Then n = "S90"
    If s = "3G" Then n = "S90"
    If s = "3H" Then n = "S90"
    If s = "3J" Then n = "S90"
    If s = "3K" Then n = "S90"
    If s = "3M" Then n = "S90"
    If s = "3Q" Then n = "S90"
    If s = "3W" Then n = "S90"
    If s = "4A" Then n = "S90"
    If s = "4C" Then n = "S90"
    If s = "4D" Then n = "S90"
    If s = "4H" Then n = "S90"
    If s = "4K" Then n = "S90"
    If s = "4Z" Then n = "S90"
    If s = "5D" Then n = "S90"

    If s = "55" Then n = "S900"
    
    If s = "72" Then n = "S910"
    If s = "7A" Then n = "S910"
    
    If s = "68" Then n = "S920"

    
    If s = "21" Then n = "Verifone"
    
    
    
    
    If s = "2A" Then n = "D210"
    If s = "23" Then n = "D210"
    
    
    If s = "2C" Then n = "S80"
    If s = "2E" Then n = "S80"
     If s = "2H" Then n = "S80"
      If s = "2P" Then n = "S80"
       If s = "2Q" Then n = "S80"
        If s = "2R" Then n = "S80"
         If s = "2Z" Then n = "S80"
         
    If s = "45" Then n = "S90"

     If s = "76" Then n = "S910"
     
     
     
     
     
     

    
    
End If

If L = 9 Then
 
End If

If L = 10 Then

    If s = "12" Then n = "A80"

    If s = "08" Then n = "Q80"   '-Pax

    If s = "20" Then n = "Verifone"
    

     If s3 = "0800" Then n = "Q80"
     
     
         

  
    
    If s = "23" Then n = "D230"   '-Pax
    
    
    
    
        
    
    
End If

If L = 11 Then

    If s = "20" Then n = "Verifone"
    If s = "21" Then n = "Verifone"
    If s = "28" Then n = "Verifone"
    If s = "31" Then n = "Verifone"
    If s = "32" Then n = "Verifone"

    
    


End If

If L = 12 Then

    If s = "J7" Then n = "SP600"

    

 
    
    

    
    
End If




If L = 17 Then
If s = "51" Then n = "D210"
End If

If L = 18 Then
If s = "51" Then n = "D210"
End If

If L = 20 Then
If s = "51" Then n = "D210"
End If

If L = 22 Then
If s = "51" Then n = "D210"
End If





Model_SerialCartKhan = Trim(n)

Application.Calculation = xlCalculationAutomatic
Application.ScreenUpdating = True

End Function
